import { useSelector } from "react-redux";
import { Dropdown, Form } from "semantic-ui-react";

/**
 * Branch (Zone model) and Zone (SubZone model) selectors used by every
 * create and edit form.  Values are strings so Semantic UI keeps them in
 * sync; use idOrNull() before sending them to the API.
 */
const ZoneFields = ({
  branch,
  zone,
  onBranchChange,
  onZoneChange,
  disabled = false,
}) => {
  const branches = useSelector((state) => state.map.branches) || [];
  const zones = useSelector((state) => state.map.zones) || [];

  const branchOptions = branches.map((item) => ({
    key: item.id,
    text: item.name,
    value: String(item.id),
  }));

  const zoneOptions = zones
    .filter((item) => !branch || String(item.zone) === String(branch))
    .map((item) => ({
      key: item.id,
      text: item.name,
      value: String(item.id),
    }));

  return (
    <Form.Group widths="equal">
      <Form.Field>
        <label>Branch</label>
        <Dropdown
          fluid
          selection
          clearable
          disabled={disabled}
          placeholder="Select branch"
          options={branchOptions}
          value={branch || ""}
          onChange={(event, { value }) => {
            onBranchChange(value || "");
          }}
        />
      </Form.Field>
      <Form.Field>
        <label>Zone</label>
        <Dropdown
          fluid
          selection
          clearable
          disabled={disabled || !branch}
          placeholder={branch ? "Select zone" : "Select branch first"}
          options={zoneOptions}
          value={zone || ""}
          onChange={(event, { value }) => {
            onZoneChange(value || "");
          }}
        />
      </Form.Field>
    </Form.Group>
  );
};

export default ZoneFields;
