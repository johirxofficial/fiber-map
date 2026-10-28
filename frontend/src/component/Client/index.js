import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { mapActions } from "../../store/map/reducer";
import { List, Button, Input, Icon, Grid, Loader, Message } from "semantic-ui-react";
import AddClient from "./AddClient";
import { useMapContext } from "../../contexts/map-context";
import {
  flyToMarker,
  matchesSearch,
  matchesBranchZone,
  branchZoneLabel,
} from "../../utility/mapUtils";

const Client = () => {
  const dispatch = useDispatch();
  const clients = useSelector((state) => state.map.clients);
  const branches = useSelector((state) => state.map.branches);
  const zones = useSelector((state) => state.map.zones);
  const branchFilter = useSelector((state) => state.map.branchFilter);
  const zoneFilter = useSelector((state) => state.map.zoneFilter);
  const liveAdd = useSelector((state) => state.map.liveAdd);
  const { map } = useMapContext();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (liveAdd && liveAdd.key === "CLIENT") {
      setVisible(true);
      dispatch(mapActions.setLiveAdd(null));
    }
  }, [liveAdd, dispatch]);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = (Array.isArray(clients) ? clients : []).filter(
    (client) =>
      matchesSearch(client.identifier, searchTerm) &&
      matchesBranchZone(client, branchFilter, zoneFilter)
  );

  return (
    <Grid>
      <AddClient show={visible} setShow={setVisible} />
      <Grid.Row style={{ marginTop: "20px" }}>
        <Grid.Column>
          <Input
            fluid
            placeholder="Search..."
            value={searchTerm}
            icon={
              searchTerm ? (
                <Icon
                  name="close"
                  size="small"
                  link
                  aria-label="Clear search"
                  title="Clear search"
                  onClick={() => setSearchTerm("")}
                />
              ) : null
            }
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <Grid.Column>
          {clients === null ? (
            <Loader active inline="centered" size="small">
              Loading clients...
            </Loader>
          ) : filteredClients.length === 0 ? (
            <Message info>
              No clients found. Click the map and use "Create new Client" to add
              one.
            </Message>
          ) : (
            <List divided relaxed style={{ overflow: "auto", maxHeight: "45vh" }}>
              {filteredClients.map((client) => (
                <List.Item
                  key={`${client.identifier || "client"}-${client.id}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    dispatch(
                      mapActions.setModelLatlang({
                        lat: client.latitude,
                        lng: client.longitude,
                      })
                    );
                    flyToMarker(map, client.latitude, client.longitude);
                  }}
                >
                  <List.Icon name="home" size="large" verticalAlign="middle" />
                  <List.Content>
                    <List.Header>{client.identifier || client.name}</List.Header>
                    {branchZoneLabel(client, branches, zones) ? (
                      <List.Description>
                        {branchZoneLabel(client, branches, zones)}
                      </List.Description>
                    ) : null}
                    {client.address ? (
                      <List.Description>{client.address}</List.Description>
                    ) : null}
                  </List.Content>
                </List.Item>
              ))}
            </List>
          )}
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <Grid.Column>
          <Button
            fluid
            secondary
            onClick={() => {
              dispatch(mapActions.setDrawLine(null));
              setVisible(true);
            }}
          >
            Create new Client
          </Button>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
};

export default Client;
