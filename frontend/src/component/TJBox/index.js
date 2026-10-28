import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { mapActions } from "../../store/map/reducer";
import { List, Button, Input, Icon, Grid, Loader, Message } from "semantic-ui-react";
import { useMapContext } from "../../contexts/map-context";
import AddTJBox from "./AddTJBox";
import {
  flyToMarker,
  matchesSearch,
  matchesBranchZone,
  branchZoneLabel,
} from "../../utility/mapUtils";

const TJBox = () => {
  const dispatch = useDispatch();
  const tjboxs = useSelector((state) => state.map.tjboxs);
  const branches = useSelector((state) => state.map.branches);
  const zones = useSelector((state) => state.map.zones);
  const branchFilter = useSelector((state) => state.map.branchFilter);
  const zoneFilter = useSelector((state) => state.map.zoneFilter);
  const liveAdd = useSelector((state) => state.map.liveAdd);
  const { map } = useMapContext();

  const [visible, setVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (liveAdd && liveAdd.key === "TJ_BOX") {
      setVisible(true);
      dispatch(mapActions.setLiveAdd(null));
    }
  }, [liveAdd, dispatch]);

  const filteredTJBoxs = (Array.isArray(tjboxs) ? tjboxs : []).filter(
    (tjbox) =>
      matchesSearch(tjbox.identifier, searchTerm) &&
      matchesBranchZone(tjbox, branchFilter, zoneFilter)
  );

  return (
    <Grid>
      <AddTJBox show={visible} setShow={setVisible} />
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
          {tjboxs === null ? (
            <Loader active inline="centered" size="small">
              Loading TJ boxes...
            </Loader>
          ) : filteredTJBoxs.length === 0 ? (
            <Message info>
              No TJ boxes found. Click the map and use "Create new TJ Box" to add
              one.
            </Message>
          ) : (
            <List divided relaxed style={{ overflow: "auto", maxHeight: "45vh" }}>
              {filteredTJBoxs.map((tjbox) => (
                <List.Item
                  key={`${tjbox.identifier || "tjbox"}-${tjbox.id}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    dispatch(
                      mapActions.setModelLatlang({
                        lat: tjbox.latitude,
                        lng: tjbox.longitude,
                      })
                    );
                    flyToMarker(map, tjbox.latitude, tjbox.longitude);
                  }}
                >
                  <List.Icon
                    name="deviantart"
                    size="large"
                    verticalAlign="middle"
                  />
                  <List.Content>
                    <List.Header>{tjbox.identifier || tjbox.name}</List.Header>
                    {branchZoneLabel(tjbox, branches, zones) ? (
                      <List.Description>
                        {branchZoneLabel(tjbox, branches, zones)}
                      </List.Description>
                    ) : null}
                    {tjbox.address ? (
                      <List.Description>{tjbox.address}</List.Description>
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
            Create new TJ Box
          </Button>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
};

export default TJBox;
