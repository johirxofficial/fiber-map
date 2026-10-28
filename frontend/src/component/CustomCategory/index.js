import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Grid, Icon, Input, List, Loader, Message } from "semantic-ui-react";
import AddCustomPoint from "./AddCustomPoint";
import { mapActions } from "../../store/map/reducer";
import { useMapContext } from "../../contexts/map-context";
import {
  branchZoneLabel,
  flyToMarker,
  matchesBranchZone,
  matchesSearch,
} from "../../utility/mapUtils";

const CustomCategory = ({ category }) => {
  const dispatch = useDispatch();
  const { map } = useMapContext();
  const customPoints = useSelector((state) => state.map.customPoints);
  const branches = useSelector((state) => state.map.branches);
  const zones = useSelector((state) => state.map.zones);
  const branchFilter = useSelector((state) => state.map.branchFilter);
  const zoneFilter = useSelector((state) => state.map.zoneFilter);
  const liveAdd = useSelector((state) => state.map.liveAdd);
  const [visible, setVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (liveAdd && liveAdd.key === category.key) {
      setVisible(true);
      dispatch(mapActions.setLiveAdd(null));
    }
  }, [liveAdd, category.key, dispatch]);

  useEffect(() => {
    setVisible(false);
    setSearchTerm("");
  }, [category.id]);

  const records = (Array.isArray(customPoints) ? customPoints : []).filter(
    (point) =>
      String(point.category) === String(category.id) &&
      (matchesSearch(point.identifier, searchTerm) ||
        matchesSearch(point.name, searchTerm) ||
        matchesSearch(point.mobile_number, searchTerm)) &&
      matchesBranchZone(point, branchFilter, zoneFilter)
  );

  return (
    <Grid>
      <AddCustomPoint category={category} show={visible} setShow={setVisible} />
      <Grid.Row style={{ marginTop: "20px" }}>
        <Grid.Column>
          <Input
            fluid
            placeholder={`Search ${category.label}...`}
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
          {customPoints === null ? (
            <Loader active inline="centered" size="small">
              Loading {category.label}...
            </Loader>
          ) : records.length === 0 ? (
            <Message info>
              No {category.label} records found. Use Live location or tap the map,
              then create one.
            </Message>
          ) : (
            <List divided relaxed style={{ overflow: "auto", maxHeight: "45vh" }}>
              {records.map((point) => (
                <List.Item
                  key={`${category.key}-${point.id}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    dispatch(
                      mapActions.setModelLatlang({
                        lat: point.latitude,
                        lng: point.longitude,
                      })
                    );
                    flyToMarker(map, point.latitude, point.longitude);
                  }}
                >
                  <List.Icon
                    name={category.icon || "tag"}
                    size="large"
                    verticalAlign="middle"
                    style={{ color: category.color || undefined }}
                  />
                  <List.Content>
                    <List.Header>{point.identifier || point.name}</List.Header>
                    {point.name && point.identifier ? (
                      <List.Description>{point.name}</List.Description>
                    ) : null}
                    {branchZoneLabel(point, branches, zones) ? (
                      <List.Description>
                        {branchZoneLabel(point, branches, zones)}
                      </List.Description>
                    ) : null}
                    {point.mobile_number ? (
                      <List.Description>{point.mobile_number}</List.Description>
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
            Create new {category.label}
          </Button>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
};

export default CustomCategory;
