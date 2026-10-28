import { useState, useMemo } from "react";
import { Popup, Marker } from "react-leaflet";
import { TJBoxIcon } from "./MarkerIcons";
import TJBoxModal from "../Modal/TJBox/TJBoxModal";
import { useSelector } from "react-redux";
import { List, ListItem } from "semantic-ui-react";
import {
  validCoordinates,
  matchesBranchZone,
  isMapLayerActive,
} from "../../utility/mapUtils";
const TJBoxs = () => {
  const tjboxs = useSelector((state) => state.map.tjboxs);
  const branchFilter = useSelector((state) => state.map.branchFilter);
  const zoneFilter = useSelector((state) => state.map.zoneFilter);
  const categoryFilter = useSelector((state) => state.map.categoryFilter);
  const isActive = isMapLayerActive(categoryFilter, "TJ_BOX");
  const [selectedTJBoxId, setSelectedTJBoxId] = useState(null);
  const [showTJBoxModal, setShowTJBoxModal] = useState(false);

  const showTJBoxs = useMemo(
    () =>
      isActive
        ? (Array.isArray(tjboxs) ? tjboxs : [])
        .filter(
          (tjbox) =>
            validCoordinates(tjbox.latitude, tjbox.longitude) &&
            matchesBranchZone(tjbox, branchFilter, zoneFilter)
        )
        .map((tjbox) => {
        return (
          <Marker
            icon={TJBoxIcon}
            key={tjbox.id}
            position={[tjbox.latitude, tjbox.longitude]}
            eventHandlers={{
              mouseover: (event) => event.target.openPopup(),
              mouseout: (event) => event.target.closePopup(),
              click: () => {
                setShowTJBoxModal(true);
                setSelectedTJBoxId(tjbox.id);
              },
            }}
          >
            <Popup>
              <List>
                <ListItem>
                  <b>ID:</b> {tjbox.identifier}
                </ListItem>
                <ListItem>
                  <b>Name:</b> {tjbox.name}
                </ListItem>
                <ListItem>
                  <b>Address:</b> {tjbox.address}
                </ListItem>
              </List>
            </Popup>
          </Marker>
        );
      })
        : [],
    [isActive, tjboxs, branchFilter, zoneFilter]
  );
  return (
    <>
      {showTJBoxModal && (
        <TJBoxModal
          tjboxId={selectedTJBoxId}
          onClose={() => setShowTJBoxModal(false)}
        />
      )}
      {showTJBoxs}
    </>
  );
};

export default TJBoxs;
