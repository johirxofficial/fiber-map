import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { mapActions } from "../../store/map/reducer";
import { List, Button, Input, Icon, Grid, Loader, Message } from "semantic-ui-react";
import { useMapContext } from "../../contexts/map-context";
import AddReseller from "./AddReseller";
import {
  flyToMarker,
  matchesSearch,
  matchesBranchZone,
  branchZoneLabel,
} from "../../utility/mapUtils";

const Reseller = () => {
  const dispatch = useDispatch();
  const resellers = useSelector((state) => state.map.resellers);
  const branches = useSelector((state) => state.map.branches);
  const zones = useSelector((state) => state.map.zones);
  const branchFilter = useSelector((state) => state.map.branchFilter);
  const zoneFilter = useSelector((state) => state.map.zoneFilter);
  const liveAdd = useSelector((state) => state.map.liveAdd);
  const { map } = useMapContext();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (liveAdd && liveAdd.key === "RESELLER") {
      setVisible(true);
      dispatch(mapActions.setLiveAdd(null));
    }
  }, [liveAdd, dispatch]);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredResellers = (Array.isArray(resellers) ? resellers : []).filter(
    (reseller) =>
      matchesSearch(reseller.identifier, searchTerm) &&
      matchesBranchZone(reseller, branchFilter, zoneFilter)
  );

  return (
    <Grid>
      <AddReseller show={visible} setShow={setVisible} />
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
          {resellers === null ? (
            <Loader active inline="centered" size="small">
              Loading resellers...
            </Loader>
          ) : filteredResellers.length === 0 ? (
            <Message info>
              No resellers found. Click the map and use "Create new Reseller" to
              add one.
            </Message>
          ) : (
            <List divided relaxed style={{ overflow: "auto", maxHeight: "45vh" }}>
              {filteredResellers.map((reseller) => (
                <List.Item
                  key={`${reseller.identifier || "reseller"}-${reseller.id}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    dispatch(
                      mapActions.setModelLatlang({
                        lat: reseller.latitude,
                        lng: reseller.longitude,
                      })
                    );
                    flyToMarker(map, reseller.latitude, reseller.longitude);
                  }}
                >
                  <List.Icon name="home" size="large" verticalAlign="middle" />
                  <List.Content>
                    <List.Header>
                      {reseller.identifier || reseller.name}
                    </List.Header>
                    {branchZoneLabel(reseller, branches, zones) ? (
                      <List.Description>
                        {branchZoneLabel(reseller, branches, zones)}
                      </List.Description>
                    ) : null}
                    {reseller.address ? (
                      <List.Description>{reseller.address}</List.Description>
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
            Create new Reseller
          </Button>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
};

export default Reseller;
