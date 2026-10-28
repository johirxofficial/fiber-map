import { useState, useMemo } from "react";
import { Popup, Marker, useMap } from "react-leaflet";
import { ClientIcon } from "./MarkerIcons";
import ClientModal from "../Modal/Client/ClientModal";
import { useSelector } from "react-redux";
import { List, ListItem } from "semantic-ui-react";
import {
  flyToMarker,
  validCoordinates,
  matchesBranchZone,
  isMapLayerActive,
} from "../../utility/mapUtils";
const Clients = () => {
  const clients = useSelector((state) => state.map.clients);
  const branchFilter = useSelector((state) => state.map.branchFilter);
  const zoneFilter = useSelector((state) => state.map.zoneFilter);
  const categoryFilter = useSelector((state) => state.map.categoryFilter);
  const isActive = isMapLayerActive(categoryFilter, "CLIENT");
  const map = useMap();
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const showClients = useMemo(
    () =>
      isActive
        ? (Array.isArray(clients) ? clients : [])
        .filter(
          (client) =>
            validCoordinates(client.latitude, client.longitude) &&
            matchesBranchZone(client, branchFilter, zoneFilter)
        )
        .map((client) => {
        return (
          <Marker
            icon={ClientIcon}
            key={client.id}
            position={[client.latitude, client.longitude]}
            eventHandlers={{
              mouseover: (event) => event.target.openPopup(),
              mouseout: (event) => event.target.closePopup(),
              click: () => {
                flyToMarker(map, client.latitude, client.longitude);
                setShowClientModal(true);
                setSelectedClientId(client.id);
              },
            }}
          >
            <Popup>
              <List>
                <ListItem>
                  <b>ID:</b> {client.identifier}
                </ListItem>
                <ListItem>
                  <b>Name:</b> {client.name}
                </ListItem>
                <ListItem>
                  <b>Address:</b> {client.address}
                </ListItem>
              </List>
            </Popup>
          </Marker>
        );
      })
        : [],
    [isActive, clients, branchFilter, zoneFilter, map]
  );
  return (
    <>
      {showClientModal && (
        <ClientModal
          clientId={selectedClientId}
          onClose={() => setShowClientModal(false)}
        />
      )}
      {showClients}
    </>
  );
};

export default Clients;
