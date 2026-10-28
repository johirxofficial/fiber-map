import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Marker, Popup, useMap } from "react-leaflet";
import { List, ListItem } from "semantic-ui-react";
import { GponIcon } from "./MarkerIcons";
import TJBoxModal from "../Modal/TJBox/TJBoxModal";
import {
  flyToMarker,
  matchesBranchZone,
  validCoordinates,
  isMapLayerActive,
} from "../../utility/mapUtils";

/**
 * GPON splitters share the TJ Box coordinates.  Grouping by TJ Box keeps one
 * marker per physical box and lists every splitter inside its popup.
 */
const Gpons = () => {
  const gpons = useSelector((state) => state.map.gpons);
  const categoryFilter = useSelector((state) => state.map.categoryFilter);
  const branchFilter = useSelector((state) => state.map.branchFilter);
  const zoneFilter = useSelector((state) => state.map.zoneFilter);
  const map = useMap();
  const [selectedTjBoxId, setSelectedTjBoxId] = useState(null);

  const groups = useMemo(() => {
    if (!isMapLayerActive(categoryFilter, "GPON")) return [];
    const grouped = new Map();
    (Array.isArray(gpons) ? gpons : [])
      .filter(
        (gpon) =>
          validCoordinates(gpon.latitude, gpon.longitude) &&
          matchesBranchZone(gpon, branchFilter, zoneFilter)
      )
      .forEach((gpon) => {
        const key = gpon.tj_box
          ? `tj-${gpon.tj_box}`
          : `${gpon.latitude},${gpon.longitude}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            key,
            latitude: Number(gpon.latitude),
            longitude: Number(gpon.longitude),
            tjBoxId: gpon.tj_box || null,
            gpons: [],
          });
        }
        grouped.get(key).gpons.push(gpon);
      });
    return Array.from(grouped.values());
  }, [categoryFilter, gpons, branchFilter, zoneFilter]);

  return (
    <>
      {selectedTjBoxId ? (
        <TJBoxModal
          tjboxId={selectedTjBoxId}
          onClose={() => setSelectedTjBoxId(null)}
        />
      ) : null}
      {groups.map((group) => (
        <Marker
          key={group.key}
          icon={GponIcon}
          position={[group.latitude, group.longitude]}
          eventHandlers={{
            mouseover: (event) => event.target.openPopup(),
            mouseout: (event) => event.target.closePopup(),
            click: () => {
              flyToMarker(map, group.latitude, group.longitude);
              if (group.tjBoxId) setSelectedTjBoxId(group.tjBoxId);
            },
          }}
        >
          <Popup>
            <List>
              {group.gpons.map((gpon) => (
                <ListItem key={`gpon-popup-${gpon.id}`}>
                  <b>Splitter:</b> {gpon.identifier || gpon.name} (
                  {gpon.splitter} way)
                </ListItem>
              ))}
              {group.tjBoxId ? (
                <ListItem>
                  <em>Click the marker to open this TJ Box.</em>
                </ListItem>
              ) : null}
            </List>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default Gpons;
