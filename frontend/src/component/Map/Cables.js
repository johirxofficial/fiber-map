import { memo, useState } from "react";
import { Popup, Polyline } from "react-leaflet";
import { useSelector } from "react-redux";
import { List, ListItem } from "semantic-ui-react";
import CableModal from "../Modal/Cable/CableModal";
import { isMapLayerActive } from "../../utility/mapUtils";

const coreColorMap = {
  2: "#0000FF", //blue
  4: "#FF0000", //red
  6: "#000000", //black
  8: "#800080", //purple
  12: "#FFA500", //orange
  24: "#FFFF00", //yellow
  48: "#008000", //yellow
};

const Cables = () => {
  const cables = useSelector((state) => state.map.cables);
  const categoryFilter = useSelector((state) => state.map.categoryFilter);
  const showCables = isMapLayerActive(categoryFilter, "CABLE");
  const [showCableModal, setShowCableModal] = useState(false);
  const [selectedCableId, setSelectedCableId] = useState(null);
  const [selectedPolyline, setSelectedPolyline] = useState(null);
  const [numberOfCores, setNumberOfCores] = useState(null);

  return (
    <>
      {showCableModal && (
        <CableModal
          numberOfCores={numberOfCores}
          cableId={selectedCableId}
          onClose={() => setShowCableModal(false)}
          polyline={selectedPolyline}
        />
      )}
      {showCables
        ? (Array.isArray(cables) ? cables : [])
        .filter(
          (cable) =>
            Array.isArray(cable?.polyline) && cable.polyline.length > 1
        )
        .map((cable) => (
        <Polyline
          key={cable.id}
          pathOptions={{
            color: coreColorMap[cable.number_of_cores] || "#2185d0",
            weight: 3,
            // color: "green",
          }}
          positions={cable.polyline}
          eventHandlers={{
            mouseover: (event) => event.target.openPopup(),
            mouseout: (event) => event.target.closePopup(),
            click: (event) => {
              setShowCableModal(true);
              setSelectedCableId(cable.id);
              setSelectedPolyline(cable.polyline);
              setNumberOfCores(cable.number_of_cores);
            },
          }}
        >
          <Popup>
            <List>
              <ListItem>
                <b>ID:</b> {cable.identifier}
              </ListItem>
              <ListItem>
                <b>Core:</b> {cable.number_of_cores}
              </ListItem>
              <ListItem>
                <b>Type:</b> {cable.type}
              </ListItem>
              <ListItem>
                <b>Length:</b> {cable.length} (meter)
              </ListItem>
              <ListItem>
                <b>Starting point:</b> {cable.starting_point}
              </ListItem>
              <ListItem>
                <b>Ending point:</b> {cable.ending_point}
              </ListItem>
            </List>
          </Popup>
        </Polyline>
      ))
        : null}
    </>
  );
};
export default memo(Cables);
