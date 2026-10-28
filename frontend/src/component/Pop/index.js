import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { mapActions } from "../../store/map/reducer";
import { useMapContext } from "../../contexts/map-context";

import { List, Button, Input, Grid, Icon, Loader, Message } from "semantic-ui-react";
import AddPop from "./AddPop";
import {
  flyToMarker,
  matchesSearch,
  matchesBranchZone,
  branchZoneLabel,
} from "../../utility/mapUtils";
const Pop = () => {
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(false);
  const pops = useSelector((state) => state.map.pops);
  const branches = useSelector((state) => state.map.branches);
  const zones = useSelector((state) => state.map.zones);
  const branchFilter = useSelector((state) => state.map.branchFilter);
  const zoneFilter = useSelector((state) => state.map.zoneFilter);
  const liveAdd = useSelector((state) => state.map.liveAdd);
  const { map } = useMapContext();

  useEffect(() => {
    if (liveAdd && liveAdd.key === "POP") {
      setVisible(true);
      dispatch(mapActions.setLiveAdd(null));
    }
  }, [liveAdd, dispatch]);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredPops = (Array.isArray(pops) ? pops : []).filter(
    (pop) =>
      matchesSearch(pop.identifier, searchTerm) &&
      matchesBranchZone(pop, branchFilter, zoneFilter)
  );

  return (
    <Grid>
      <AddPop show={visible} setShow={setVisible} />
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
          {pops === null ? (
            <Loader active inline="centered" size="small">
              Loading POPs...
            </Loader>
          ) : filteredPops.length === 0 ? (
            <Message info>
              No POPs found. Click the map and use "Create new Pop" to add one.
            </Message>
          ) : (
            <List divided relaxed style={{ overflow: "auto", maxHeight: "45vh" }}>
              {filteredPops.map((pop) => (
                <List.Item
                  key={`${pop.identifier || "pop"}-${pop.id}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    dispatch(
                      mapActions.setModelLatlang({
                        lat: pop.latitude,
                        lng: pop.longitude,
                      })
                    );
                    flyToMarker(map, pop.latitude, pop.longitude);
                  }}
                >
                  <List.Icon name="building" size="large" verticalAlign="middle" />
                  <List.Content>
                    <List.Header>{pop.identifier || pop.name}</List.Header>
                    {branchZoneLabel(pop, branches, zones) ? (
                      <List.Description>
                        {branchZoneLabel(pop, branches, zones)}
                      </List.Description>
                    ) : null}
                    {pop.pop_type ? (
                      <List.Description>{pop.pop_type}</List.Description>
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
            Create new Pop
          </Button>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
};

export default Pop;
