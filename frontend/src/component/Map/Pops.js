import { useState, useMemo } from "react";
import { Popup, Marker, useMap } from "react-leaflet";
import { PopIcon } from "./MarkerIcons";
import PopModal from "../Modal/POP/PopModal";
import { useSelector } from "react-redux";
import { List, ListItem } from "semantic-ui-react";
import {
  flyToMarker,
  validCoordinates,
  matchesBranchZone,
  isMapLayerActive,
} from "../../utility/mapUtils";
const Pops = () => {
  const pops = useSelector((state) => state.map.pops);
  const branchFilter = useSelector((state) => state.map.branchFilter);
  const zoneFilter = useSelector((state) => state.map.zoneFilter);
  const categoryFilter = useSelector((state) => state.map.categoryFilter);
  const isActive = isMapLayerActive(categoryFilter, "POP");
  const map = useMap();

  const [selectedPopId, setSelectedPopId] = useState(null);
  const [selectedPopType, setSelectedPopType] = useState("");
  const [showPopModal, setShowPopModal] = useState(false);

  const showPops = useMemo(
    () =>
      isActive
        ? (Array.isArray(pops) ? pops : [])
        .filter(
          (pop) =>
            validCoordinates(pop.latitude, pop.longitude) &&
            matchesBranchZone(pop, branchFilter, zoneFilter)
        )
        .map((pop) => {
        return (
          <Marker
            icon={PopIcon}
            key={pop.id}
            position={[pop.latitude, pop.longitude]}
            eventHandlers={{
              mouseover: (event) => event.target.openPopup(),
              mouseout: (event) => event.target.closePopup(),
              click: () => {
                setShowPopModal(true);
                flyToMarker(map, pop.latitude, pop.longitude);

                setSelectedPopId(pop.id);
                setSelectedPopType(pop.pop_type);
              },
            }}
          >
            <Popup>
              <List>
                <ListItem>
                  <b>ID:</b> {pop.identifier}
                </ListItem>
                <ListItem>
                  <b>Name:</b> {pop.name}
                </ListItem>
                <ListItem>
                  <b>Type:</b> {pop.pop_type}
                </ListItem>
                <ListItem>
                  <b>Address:</b> {pop.address}
                </ListItem>
              </List>
            </Popup>
          </Marker>
        );
      })
        : [],
    [isActive, pops, branchFilter, zoneFilter, map]
  );
  return (
    <>
      {showPopModal && (
        <PopModal
          popId={selectedPopId}
          popType={selectedPopType}
          onClose={() => setShowPopModal(false)}
        />
      )}
      {showPops}
    </>
  );
};

export default Pops; //Pops;
