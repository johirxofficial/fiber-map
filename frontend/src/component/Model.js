import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Dropdown, Icon, Message } from "semantic-ui-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Pop from "./Pop";
import Client from "./Client";
import TJBox from "./TJBox";
import Reseller from "./Reseller";
import CustomCategory from "./CustomCategory";
import GponFilterList from "./GponFilterList";
import { mapActions } from "../store/map/reducer";
import { useMapContext } from "../contexts/map-context";
import { distanceKm } from "../config/mapConfig";
import {
  describeGeolocationError,
  requestCurrentPosition,
} from "../utility/geolocation";
import { useSiteConfig } from "../contexts/site-context";

const FALLBACK_CATEGORIES = [
  { id: "pop", key: "POP", label: "POP", icon: "building" },
  { id: "client", key: "CLIENT", label: "Client", icon: "user" },
  { id: "tj", key: "TJ_BOX", label: "TJ Box", icon: "inbox" },
  { id: "reseller", key: "RESELLER", label: "Reseller", icon: "shop" },
];

/* The full-network view is a map filter rather than a record type.  It keeps
 * every network layer visible at the same time so the map can be inspected
 * without switching category by category. */
const FULL_NETWORK_CATEGORY = {
  id: "full-network",
  key: "FULL_NETWORK",
  label: "See Full Network",
  icon: "globe",
  special: true,
};

/* These are map filter views rather than record types.  They are included in
 * the selector so dashboard deep links (?category=GPON / ?category=CABLE) show
 * a meaningful label instead of silently falling back to POP. */
const SPECIAL_CATEGORIES = [
  {
    id: "gpon",
    key: "GPON",
    label: "GPON Splitters",
    icon: "sitemap",
    special: true,
  },
  {
    id: "cable",
    key: "CABLE",
    label: "Cables",
    icon: "code branch",
    special: true,
  },
];

const BUILT_IN_COMPONENTS = {
  POP: Pop,
  CLIENT: Client,
  TJ_BOX: TJBox,
  RESELLER: Reseller,
};

const Models = () => {
  const dispatch = useDispatch();
  const { map } = useMapContext();
  const { mapConfig } = useSiteConfig();
  const categories = useSelector((state) => state.map.categories);
  const selectedKey = useSelector((state) => state.map.categoryFilter) || "POP";
  const [searchParams, setSearchParams] = useSearchParams();
  const [locating, setLocating] = useState(false);

  const availableCategories = useMemo(() => {
    const base =
      Array.isArray(categories) && categories.length
        ? categories
        : FALLBACK_CATEGORIES;
    return [
      FULL_NETWORK_CATEGORY,
      ...base.filter((category) => category.key !== FULL_NETWORK_CATEGORY.key),
      ...SPECIAL_CATEGORIES,
    ];
  }, [categories]);

  const categoriesLoaded = Array.isArray(categories) && categories.length > 0;

  useEffect(() => {
    if (
      categoriesLoaded &&
      !availableCategories.some((category) => category.key === selectedKey)
    ) {
      dispatch(mapActions.setCategoryFilter("POP"));
    }
  }, [availableCategories, categoriesLoaded, dispatch, selectedKey]);

  const options = availableCategories.map((category) => ({
    key: category.key,
    text: category.label,
    value: category.key,
    icon: category.icon || "tag",
  }));

  const selected =
    availableCategories.find((category) => category.key === selectedKey) ||
    availableCategories[0];

  const BuiltInComponent = BUILT_IN_COMPONENTS[selected?.key];

  const selectCategory = (value) => {
    dispatch(mapActions.setCategoryFilter(value || "POP"));
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set("category", value);
    } else {
      next.delete("category");
    }
    setSearchParams(next, { replace: true });
  };

  const flyTo = (lat, lng, zoom) => {
    if (map && typeof map.flyTo === "function") {
      map.flyTo([lat, lng], zoom);
    }
  };

  const openLiveForm = (coords, accuracy) => {
    dispatch(mapActions.updateLatLang(coords));
    dispatch(
      mapActions.setLiveAdd({
        key: selected?.key,
        nonce: Date.now(),
        latitude: coords.lat,
        longitude: coords.lng,
      })
    );
    flyTo(coords.lat, coords.lng, 17);
    if (Number.isFinite(accuracy) && accuracy > 5000) {
      toast.warning(
        `Live location captured, but the GPS accuracy is about ±${Math.round(
          accuracy / 1000
        )} km. Please check the marker before saving.`
      );
    } else {
      toast.success("Live location captured.");
    }
  };

  const openFormWithoutLocation = (message) => {
    dispatch(mapActions.updateLatLang(null));
    dispatch(
      mapActions.setLiveAdd({
        key: selected?.key,
        nonce: Date.now(),
        latitude: null,
        longitude: null,
      })
    );
    // Never reuse a possibly wrong map centre. Return to the configured service
    // area and let the user click the exact point.
    flyTo(mapConfig.center.lat, mapConfig.center.lng, mapConfig.zoom);
    toast.warning(message);
  };

  const startLive = async () => {
    setLocating(true);
    try {
      const { latitude, longitude, accuracy } = await requestCurrentPosition();
      const distance = distanceKm(
        latitude,
        longitude,
        mapConfig.center.lat,
        mapConfig.center.lng
      );

      if (
        mapConfig.maxDistanceKm > 0 &&
        distance > mapConfig.maxDistanceKm
      ) {
        openFormWithoutLocation(
          `Your browser reported a location ${Math.round(
            distance
          )} km away from the configured map area, so it was not used. Allow precise location or click the map to set the point.`
        );
        return;
      }

      openLiveForm(
        { lat: latitude, lng: longitude },
        accuracy === null ? undefined : accuracy
      );
    } catch (error) {
      openFormWithoutLocation(describeGeolocationError(error));
    } finally {
      setLocating(false);
    }
  };

  return (
    <>
      <Dropdown
        fluid
        selection
        options={options}
        value={selected?.key}
        onChange={(e, { value }) => selectCategory(value)}
        style={{ marginBottom: 8 }}
      />
      {!selected?.special ? (
        <>
          <Button
            fluid
            color="green"
            icon
            labelPosition="left"
            loading={locating}
            onClick={startLive}
            className="live-location-button"
          >
            <Icon name="location arrow" />
            Live location
          </Button>
          <div className="live-hint">
            Capture your current GPS position and open the Add form. If GPS is
            blocked or reports a location outside the configured area, the form
            opens without coordinates &mdash; click the map to set the exact
            point.
          </div>
        </>
      ) : null}
      {BuiltInComponent ? (
        <BuiltInComponent />
      ) : selected?.key === "FULL_NETWORK" ? (
        <Message
          info
          icon="globe"
          header="Full network view"
          content="POPs, clients, TJ boxes, resellers, GPON splitters, cables and custom network points are shown together. Use the branch and zone filters above to narrow the map."
        />
      ) : selected?.key === "GPON" ? (
        <>
          <GponFilterList />
          <Message
            info
            content="GPON splitters are created from a TJ Box. Open a TJ Box marker and use the Create Splitter tab."
          />
        </>
      ) : selected?.key === "CABLE" ? (
        <Message
          info
          content="Cable lines are shown on the map. Use the draw toolbar line tool to add a cable."
        />
      ) : selected ? (
        <CustomCategory category={selected} />
      ) : (
        <Message warning content="No categories available. Add one in Management → Categories." />
      )}
    </>
  );
};

export default Models;
