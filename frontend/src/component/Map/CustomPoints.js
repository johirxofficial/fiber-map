import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import {
  matchesBranchZone,
  validCoordinates,
  FULL_NETWORK_KEY,
} from "../../utility/mapUtils";

function markerIcon(point) {
  const color = /^#[0-9a-fA-F]{6}$/.test(point.category_color || "")
    ? point.category_color
    : "#2185d0";
  const label = String(point.category_label || point.category_key || "?")
    .trim()
    .charAt(0)
    .toUpperCase();
  return L.divIcon({
    className: "custom-point-marker",
    html: `<div class="custom-point-pin" style="--pin-color:${color}"><span>${label}</span></div>`,
    iconSize: [30, 38],
    iconAnchor: [15, 36],
    popupAnchor: [0, -34],
  });
}

const CustomPoints = () => {
  const customPoints = useSelector((state) => state.map.customPoints);
  const branchFilter = useSelector((state) => state.map.branchFilter);
  const zoneFilter = useSelector((state) => state.map.zoneFilter);
  const categoryFilter = useSelector((state) => state.map.categoryFilter);
  const showAll = categoryFilter === FULL_NETWORK_KEY;
  const map = useMap();

  const markers = useMemo(
    () =>
      (Array.isArray(customPoints) ? customPoints : [])
        .filter(
          (point) =>
            validCoordinates(point.latitude, point.longitude) &&
            matchesBranchZone(point, branchFilter, zoneFilter) &&
            (showAll ||
              String(point.category_key) === String(categoryFilter))
        )
        .map((point) => (
          <Marker
            key={`custom-${point.id}`}
            position={[Number(point.latitude), Number(point.longitude)]}
            icon={markerIcon(point)}
            eventHandlers={{
              click: () => map.flyTo([point.latitude, point.longitude], 17),
            }}
          >
            <Popup>
              <strong>
                {point.category_label}: {point.identifier || point.name}
              </strong>
              <br />
              {point.name && point.identifier ? (
                <>
                  {point.name}
                  <br />
                </>
              ) : null}
              {point.mobile_number ? (
                <>
                  {point.mobile_number}
                  <br />
                </>
              ) : null}
              {point.address ? (
                <>
                  {point.address}
                  <br />
                </>
              ) : null}
              {point.zone_name || point.subzone_name ? (
                <span>
                  {[point.zone_name, point.subzone_name]
                    .filter(Boolean)
                    .join(" / ")}
                </span>
              ) : null}
            </Popup>
          </Marker>
        )),
    [customPoints, branchFilter, zoneFilter, categoryFilter, showAll, map]
  );

  return <>{markers}</>;
};

export default CustomPoints;
