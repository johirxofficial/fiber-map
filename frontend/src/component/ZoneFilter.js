import { useDispatch, useSelector } from "react-redux";
import { Button, Dropdown, Segment } from "semantic-ui-react";
import { mapActions } from "../store/map/reducer";

/**
 * Branch + Zone filter.  Branch is stored in Zone and Zone in SubZone, but
 * the UI uses the user-facing names.  Changing either control updates Redux
 * immediately, which re-renders both the model lists and the map markers.
 */
const ZoneFilter = () => {
  const dispatch = useDispatch();
  const branches = useSelector((state) => state.map.branches) || [];
  const zones = useSelector((state) => state.map.zones) || [];
  const branchFilter = useSelector((state) => state.map.branchFilter) || "";
  const zoneFilter = useSelector((state) => state.map.zoneFilter) || "";

  const branchOptions = branches.map((branch) => ({
    key: branch.id,
    text: branch.name,
    value: String(branch.id),
  }));

  const zoneOptions = zones
    .filter(
      (zone) =>
        !branchFilter || String(zone.zone) === String(branchFilter)
    )
    .map((zone) => ({
      key: zone.id,
      text: zone.name,
      value: String(zone.id),
    }));

  return (
    <Segment className="zone-filter">
      <div className="zone-filter-title">Filter Branch &amp; Zone</div>
      <Dropdown
        fluid
        selection
        clearable
        placeholder="All Branches"
        options={branchOptions}
        value={branchFilter}
        onChange={(event, { value }) => {
          dispatch(mapActions.setBranchFilter(value || ""));
          dispatch(mapActions.setZoneFilter(""));
        }}
        style={{ marginBottom: 8 }}
      />
      <Dropdown
        fluid
        selection
        clearable
        placeholder="All Zones"
        options={zoneOptions}
        value={zoneFilter}
        disabled={!branchFilter}
        onChange={(event, { value }) => {
          dispatch(mapActions.setZoneFilter(value || ""));
        }}
      />
      {branchFilter || zoneFilter ? (
        <Button
          basic
          fluid
          size="mini"
          style={{ marginTop: 8 }}
          onClick={() => {
            dispatch(mapActions.setBranchFilter(""));
            dispatch(mapActions.setZoneFilter(""));
          }}
        >
          Clear filter
        </Button>
      ) : null}
    </Segment>
  );
};

export default ZoneFilter;
