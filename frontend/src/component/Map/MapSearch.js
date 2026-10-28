import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Icon } from "semantic-ui-react";
import { useMapContext } from "../../contexts/map-context";
import { mapActions } from "../../store/map/reducer";
import { flyToMarker, validCoordinates } from "../../utility/mapUtils";

const NOMINATIM_SEARCH_URL = "/api/geocode/";
const DEFAULT_SEARCH_CENTER = { lat: 23.8103, lng: 90.4125 };

const text = (value) => String(value ?? "").trim();

const COORDINATE_PATTERN =
  /^(?:lat(?:itude)?\s*[:=]?\s*)?([+-]?\d{1,3}(?:\.\d+)?)\s*°?\s*([NS])?\s*(?:,|\s)\s*(?:(?:lng|lon|long|longitude)\s*[:=]?\s*)?([+-]?\d{1,3}(?:\.\d+)?)\s*°?\s*([EW])?$/i;
const DMS_PATTERN =
  /([+-]?\d{1,3}(?:\.\d+)?)\s*°\s*(?:(\d{1,2}(?:\.\d+)?)\s*['′]\s*)?(?:(\d{1,2}(?:\.\d+)?)\s*["″]\s*)?\s*([NSEW])/gi;

const signedCoordinate = (value, hemisphere) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  if (!hemisphere) return number;
  const direction = hemisphere.toUpperCase();
  return (direction === "S" || direction === "W" ? -1 : 1) * Math.abs(number);
};

const parseDmsCoordinates = (value) => {
  const matches = [...value.matchAll(DMS_PATTERN)];
  if (matches.length !== 2) return null;

  const values = matches.map((match) => {
    const degrees = Math.abs(Number(match[1]));
    const minutes = Number(match[2] || 0);
    const seconds = Number(match[3] || 0);
    const hemisphere = match[4].toUpperCase();
    if (
      !Number.isFinite(degrees) ||
      !Number.isFinite(minutes) ||
      !Number.isFinite(seconds) ||
      minutes >= 60 ||
      seconds >= 60
    ) {
      return null;
    }
    const decimal = degrees + minutes / 60 + seconds / 3600;
    return {
      value: hemisphere === "S" || hemisphere === "W" ? -decimal : decimal,
      axis: hemisphere === "N" || hemisphere === "S" ? "lat" : "lng",
    };
  });

  if (values.some((item) => item === null)) return null;
  if (values[0].axis === values[1].axis) return null;
  const latitude = values.find((item) => item.axis === "lat")?.value;
  const longitude = values.find((item) => item.axis === "lng")?.value;
  if (!validCoordinates(latitude, longitude)) return null;
  return { lat: latitude, lng: longitude };
};

/* Accepts decimal and DMS coordinates copied from Google Maps, e.g.
 * "23.8103, 90.4125", "23.8103N 90.4125E" or 23°48'37.1"N 90°24'45.0"E. */
const parseCoordinateSearch = (value) => {
  const term = text(value);
  if (!term) return null;

  if (term.includes("°")) {
    const dms = parseDmsCoordinates(term);
    if (dms) return dms;
  }

  const match = term.match(COORDINATE_PATTERN);
  if (!match) return null;
  const latitude = signedCoordinate(match[1], match[2]);
  const longitude = signedCoordinate(match[3], match[4]);
  if (!validCoordinates(latitude, longitude)) return null;
  return { lat: latitude, lng: longitude };
};

const coordinatePlace = (coordinates) =>
  makeEntry({
    id: `coordinates-${coordinates.lat}-${coordinates.lng}`,
    category: null,
    categoryLabel: "Latitude / Longitude",
    title: `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`,
    subtitle: "Go to these coordinates",
    searchText: `${coordinates.lat} ${coordinates.lng}`,
    latitude: coordinates.lat,
    longitude: coordinates.lng,
    address: true,
  });

const uniquePlaces = (places) => {
  const seen = new Set();
  return places.filter((place) => {
    const key = `${place.title}|${place.latitude.toFixed(5)}|${place.longitude.toFixed(5)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const nominatimPlaceEntry = (result, index, fallbackTitle) => {
  const latitude = Number(result?.lat);
  const longitude = Number(result?.lon);
  if (!validCoordinates(latitude, longitude)) return null;

  const address = result?.address || {};
  const displayName = text(result?.display_name);
  const title =
    text(result?.name) ||
    text(address.city) ||
    text(address.town) ||
    text(address.village) ||
    text(address.county) ||
    text(address.state) ||
    displayName.split(",")[0] ||
    fallbackTitle;
  const subtitle = [
    address.house_number,
    address.road,
    address.suburb,
    address.city && address.city !== title ? address.city : "",
    address.state && address.state !== title ? address.state : "",
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
  const placeType = text(result?.type || result?.class);
  const countryCode = text(address.country_code).toLowerCase();
  const entry = makeEntry({
    id: `nominatim-${result?.place_id || index}-${latitude}-${longitude}`,
    category: null,
    categoryLabel: address.country
      ? `Worldwide place · ${address.country}`
      : placeType
      ? `Worldwide ${placeType}`
      : "Worldwide place",
    title,
    subtitle: subtitle || displayName,
    searchText: `${displayName} ${placeType}`,
    latitude,
    longitude,
    address: true,
  });
  return { ...entry, countryCode };
};

/* Nominatim is proxied through Django so the browser never depends on the
 * service's CORS policy and the request carries a proper identifying header. */
async function fetchNominatimPlaces(term, signal, center) {
  const bias = validCoordinates(center?.lat, center?.lng)
    ? center
    : DEFAULT_SEARCH_CENTER;
  const params = new URLSearchParams({
    q: term,
    lat: String(bias.lat),
    lng: String(bias.lng),
  });
  const token = localStorage.getItem("token");
  const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
    signal,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`Place search failed (${response.status})`);
  const payload = await response.json();
  const results = Array.isArray(payload) ? payload : [];
  const places = results
    .map((result, index) => nominatimPlaceEntry(result, index, term))
    .filter(Boolean);
  return uniquePlaces(
    [...places.filter((place) => place.countryCode === "bd"), ...places.filter((place) => place.countryCode !== "bd")]
  ).slice(0, 12);
}

const makeEntry = ({
  id,
  category,
  categoryLabel,
  title,
  subtitle,
  searchText,
  latitude,
  longitude,
  address = false,
}) => ({
  id,
  category,
  categoryLabel,
  title: text(title) || categoryLabel,
  subtitle: text(subtitle),
  searchText: [
    title,
    subtitle,
    searchText,
    category,
    categoryLabel,
  ]
    .map(text)
    .join(" ")
    .toLowerCase(),
  latitude: Number(latitude),
  longitude: Number(longitude),
  address,
});

/**
 * Always-visible map search.  It searches the network records loaded in Redux,
 * accepts latitude/longitude coordinates, and searches worldwide places through
 * OpenStreetMap Nominatim (proxied by Django).  Nominatim results near the
 * current map view are preferred, with Bangladesh results ranked first.
 * Local record and coordinate search still work entirely offline.
 */
const MapSearch = () => {
  const dispatch = useDispatch();
  const { map } = useMapContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const pops = useSelector((state) => state.map.pops);
  const clients = useSelector((state) => state.map.clients);
  const resellers = useSelector((state) => state.map.resellers);
  const tjboxs = useSelector((state) => state.map.tjboxs);
  const gpons = useSelector((state) => state.map.gpons);
  const customPoints = useSelector((state) => state.map.customPoints);
  const cables = useSelector((state) => state.map.cables);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [addressResults, setAddressResults] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const coordinateResult = useMemo(() => {
    const coordinates = parseCoordinateSearch(query);
    return coordinates ? coordinatePlace(coordinates) : null;
  }, [query]);
  const hideTimer = useRef(null);
  const controlRef = useRef(null);
  const inputRef = useRef(null);

  const closeSearch = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    setOpen(false);
  }, []);

  useEffect(
    () => () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    },
    []
  );

  /* Close the results when the user clicks/taps anywhere outside the search
   * control, or presses Escape.  This keeps the map popup from covering the
   * Add/Edit sidebar and its input fields. */
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        controlRef.current &&
        !controlRef.current.contains(event.target)
      ) {
        closeSearch();
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeSearch();
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [closeSearch]);

  const entries = useMemo(() => {
    const list = [];
    (Array.isArray(pops) ? pops : []).forEach((record) => {
      if (!validCoordinates(record.latitude, record.longitude)) return;
      list.push(
        makeEntry({
          id: `pop-${record.id}`,
          category: "POP",
          categoryLabel: "POP",
          title: record.identifier || record.name,
          subtitle: [record.name, record.pop_type, record.address]
            .filter(Boolean)
            .join(" · "),
          searchText: record.address,
          latitude: record.latitude,
          longitude: record.longitude,
        })
      );
    });
    (Array.isArray(clients) ? clients : []).forEach((record) => {
      if (!validCoordinates(record.latitude, record.longitude)) return;
      list.push(
        makeEntry({
          id: `client-${record.id}`,
          category: "CLIENT",
          categoryLabel: "Client",
          title: record.identifier || record.name,
          subtitle: [record.name, record.mobile_number, record.address]
            .filter(Boolean)
            .join(" · "),
          searchText: record.address,
          latitude: record.latitude,
          longitude: record.longitude,
        })
      );
    });
    (Array.isArray(resellers) ? resellers : []).forEach((record) => {
      if (!validCoordinates(record.latitude, record.longitude)) return;
      list.push(
        makeEntry({
          id: `reseller-${record.id}`,
          category: "RESELLER",
          categoryLabel: "Reseller",
          title: record.identifier || record.name,
          subtitle: [record.name, record.mobile_number, record.address]
            .filter(Boolean)
            .join(" · "),
          searchText: record.address,
          latitude: record.latitude,
          longitude: record.longitude,
        })
      );
    });
    (Array.isArray(tjboxs) ? tjboxs : []).forEach((record) => {
      if (!validCoordinates(record.latitude, record.longitude)) return;
      list.push(
        makeEntry({
          id: `tjbox-${record.id}`,
          category: "TJ_BOX",
          categoryLabel: "TJ Box",
          title: record.identifier || record.name,
          subtitle: [record.name, record.address].filter(Boolean).join(" · "),
          searchText: record.address,
          latitude: record.latitude,
          longitude: record.longitude,
        })
      );
    });
    (Array.isArray(gpons) ? gpons : []).forEach((record) => {
      if (!validCoordinates(record.latitude, record.longitude)) return;
      list.push(
        makeEntry({
          id: `gpon-${record.id}`,
          category: "GPON",
          categoryLabel: "GPON Splitter",
          title: record.identifier || record.name,
          subtitle: [record.name, `${record.splitter} way`, record.address]
            .filter(Boolean)
            .join(" · "),
          searchText: record.address,
          latitude: record.latitude,
          longitude: record.longitude,
        })
      );
    });
    (Array.isArray(customPoints) ? customPoints : []).forEach((record) => {
      if (!validCoordinates(record.latitude, record.longitude)) return;
      list.push(
        makeEntry({
          id: `custom-${record.id}`,
          category: record.category_key,
          categoryLabel: record.category_label || record.category_key,
          title: record.identifier || record.name,
          subtitle: [record.name, record.mobile_number, record.address]
            .filter(Boolean)
            .join(" · "),
          searchText: record.address,
          latitude: record.latitude,
          longitude: record.longitude,
        })
      );
    });
    (Array.isArray(cables) ? cables : []).forEach((record) => {
      const points = Array.isArray(record.polyline) ? record.polyline : [];
      const point = points[Math.floor(points.length / 2)];
      if (!Array.isArray(point) || !validCoordinates(point[0], point[1])) return;
      list.push(
        makeEntry({
          id: `cable-${record.id}`,
          category: "CABLE",
          categoryLabel: "Cable",
          title: record.identifier,
          subtitle: [
            record.type,
            `${record.number_of_cores} core`,
            record.starting_point && record.ending_point
              ? `${record.starting_point} → ${record.ending_point}`
              : "",
          ]
            .filter(Boolean)
            .join(" · "),
          searchText: `${record.starting_point} ${record.ending_point}`,
          latitude: point[0],
          longitude: point[1],
        })
      );
    });
    return list;
  }, [pops, clients, resellers, tjboxs, gpons, customPoints, cables]);

  const localResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return entries
      .filter((entry) => entry.searchText.includes(term))
      .slice(0, 8);
  }, [entries, query]);

  useEffect(() => {
    const term = query.trim();
    if (coordinateResult) {
      setAddressResults([]);
      setAddressLoading(false);
      return undefined;
    }
    if (term.length < 3) {
      setAddressResults([]);
      setAddressLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setAddressLoading(true);
      try {
        const leafletCenter =
          map && typeof map.getCenter === "function" ? map.getCenter() : null;
        const center =
          leafletCenter && validCoordinates(leafletCenter.lat, leafletCenter.lng)
            ? { lat: leafletCenter.lat, lng: leafletCenter.lng }
            : DEFAULT_SEARCH_CENTER;
        const places = await fetchNominatimPlaces(
          term,
          controller.signal,
          center
        );
        setAddressResults(places);
      } catch (error) {
        if (error.name !== "AbortError") setAddressResults([]);
      } finally {
        if (!controller.signal.aborted) setAddressLoading(false);
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [coordinateResult, map, query]);

  const results = useMemo(() => {
    if (coordinateResult) return [coordinateResult];
    return uniquePlaces([...localResults, ...addressResults]);
  }, [addressResults, coordinateResult, localResults]);

  const choose = (entry) => {
    setQuery("");
    setAddressResults([]);
    closeSearch();
    if (inputRef.current) inputRef.current.blur();
    if (entry.address) {
      dispatch(
        mapActions.updateLatLang({ lat: entry.latitude, lng: entry.longitude })
      );
      dispatch(
        mapActions.setModelLatlang({
          lat: entry.latitude,
          lng: entry.longitude,
        })
      );
    } else if (entry.category) {
      dispatch(mapActions.setCategoryFilter(entry.category));
      const next = new URLSearchParams(searchParams);
      next.set("category", entry.category);
      setSearchParams(next, { replace: true });
    }
    flyToMarker(map, entry.latitude, entry.longitude, entry.address ? 16 : 18);
  };

  const showResults = open && query.trim().length > 0;
  const noResults =
    showResults && results.length === 0 && !addressLoading;

  return (
    <div
      ref={controlRef}
      className="map-search-control"
      onBlur={() => {
        hideTimer.current = window.setTimeout(closeSearch, 120);
      }}
    >
      <div className="map-search-input">
        <Icon name="search" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          role="combobox"
          aria-label="Search map"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls="map-search-results"
          placeholder="Search place, address or lat, lng..."
          title="Search network points, places, or coordinates such as 23.8103, 90.4125"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && results.length > 0) {
              event.preventDefault();
              choose(results[0]);
            } else if (event.key === "Escape") {
              event.preventDefault();
              closeSearch();
              if (inputRef.current) inputRef.current.blur();
            }
          }}
        />
        {query ? (
          <button
            type="button"
            className="map-search-clear"
            aria-label="Clear search"
            title="Clear search"
            onPointerDown={(event) => {
              event.preventDefault();
              setQuery("");
              setAddressResults([]);
              closeSearch();
              if (inputRef.current) inputRef.current.focus();
            }}
          >
            <Icon name="close" />
          </button>
        ) : null}
      </div>
      {showResults ? (
        <div
          id="map-search-results"
          className="map-search-results"
          role="listbox"
        >
          {results.map((entry) => (
            <button
              type="button"
              role="option"
              aria-selected="false"
              key={entry.id}
              className="map-search-result"
              onPointerDown={(event) => {
                event.preventDefault();
                choose(entry);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  choose(entry);
                }
              }}
            >
              <span className="map-search-result-title">
                <Icon
                  name={
                    entry.address
                      ? "map marker alternate"
                      : entry.category === "CABLE"
                      ? "code branch"
                      : "map pin"
                  }
                />
                {entry.title}
              </span>
              <span className="map-search-result-meta">
                {entry.categoryLabel}
                {entry.subtitle ? ` · ${entry.subtitle}` : ""}
              </span>
            </button>
          ))}
          {addressLoading ? (
            <div className="map-search-empty">
              Searching OpenStreetMap places...
            </div>
          ) : null}
          {noResults ? (
            <div className="map-search-empty">
              No network point or place found.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default MapSearch;
