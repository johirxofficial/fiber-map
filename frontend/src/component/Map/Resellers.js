import { useState, useMemo } from "react";
import { Popup, Marker, useMap } from "react-leaflet";
import { ResellerIcon } from "./MarkerIcons";
import { useSelector } from "react-redux";
import { List, ListItem } from "semantic-ui-react";
import ResellerModal from "../Modal/Reseller/ResellerModal";
import {
  flyToMarker,
  validCoordinates,
  matchesBranchZone,
  isMapLayerActive,
} from "../../utility/mapUtils";
const Resellers = () => {
  const resellers = useSelector((state) => state.map.resellers);
  const branchFilter = useSelector((state) => state.map.branchFilter);
  const zoneFilter = useSelector((state) => state.map.zoneFilter);
  const categoryFilter = useSelector((state) => state.map.categoryFilter);
  const isActive = isMapLayerActive(categoryFilter, "RESELLER");
  const map = useMap();
  const [showResellerModal, setShowResellerModal] = useState(false);
  const [selectedResellerId, setSelectedResellerId] = useState(null);
  const showResellers = useMemo(
    () =>
      isActive
        ? (Array.isArray(resellers) ? resellers : [])
        .filter(
          (reseller) =>
            validCoordinates(reseller.latitude, reseller.longitude) &&
            matchesBranchZone(reseller, branchFilter, zoneFilter)
        )
        .map((reseller) => {
        return (
          <Marker
            icon={ResellerIcon}
            key={reseller.id}
            position={[reseller.latitude, reseller.longitude]}
            eventHandlers={{
              mouseover: (event) => event.target.openPopup(),
              mouseout: (event) => event.target.closePopup(),
              click: () => {
                flyToMarker(map, reseller.latitude, reseller.longitude);
                setShowResellerModal(true);
                setSelectedResellerId(reseller.id);
              },
            }}
          >
            <Popup>
              <List>
                <ListItem>
                  <b>ID:</b> {reseller.identifier}
                </ListItem>
                <ListItem>
                  <b>Name:</b> {reseller.name}
                </ListItem>
                <ListItem>
                  <b>Address:</b> {reseller.address}
                </ListItem>
              </List>
            </Popup>
          </Marker>
        );
      })
        : [],
    [isActive, resellers, branchFilter, zoneFilter, map]
  );
  return (
    <>
      {showResellerModal && (
        <ResellerModal
          resellerId={selectedResellerId}
          onClose={() => setShowResellerModal(false)}
        />
      )}
      {showResellers}
    </>
  );
};

export default Resellers;
