import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Grid, Segment, Message } from "semantic-ui-react";
import Models from "../component/Model";
import NetworkMap from "../component/Map";
import ZoneFilter from "../component/ZoneFilter";
import { mapActions } from "../store/map/reducer";

const SYSTEM_KEYS = [
  "POP",
  "CLIENT",
  "TJ_BOX",
  "RESELLER",
  "GPON",
  "CABLE",
  "FULL_NETWORK",
];

export default function NetworkPoint() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const rawCategory = (searchParams.get("category") || "").trim();
  const category = rawCategory
    ? SYSTEM_KEYS.includes(rawCategory.toUpperCase())
      ? rawCategory.toUpperCase()
      : rawCategory
    : "POP";

  useEffect(() => {
    dispatch(mapActions.setCategoryFilter(category));
  }, [category, dispatch]);

  return (
    <Grid padded stackable className="network-point-page">
      <Grid.Column mobile={16} tablet={5} computer={3} className="models-column">
        <Message success header="MODEL &amp; MAP FILTER" style={{ textAlign: "center" }} />
        <ZoneFilter />
        <Segment className="models-panel">
          <Models />
        </Segment>
      </Grid.Column>
      <Grid.Column mobile={16} tablet={11} computer={13} className="map-column">
        <Segment className="map-panel">
          <NetworkMap />
        </Segment>
      </Grid.Column>
    </Grid>
  );
}
