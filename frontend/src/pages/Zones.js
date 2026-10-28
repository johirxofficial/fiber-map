import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Divider,
  Form,
  Grid,
  Header,
  Icon,
  Label,
  Loader,
  Message,
  Segment,
  Table,
} from "semantic-ui-react";
import { toast } from "react-toastify";
import {
  createSubZone,
  createZone,
  deleteSubZone,
  deleteZone,
  getSubZones,
  getZones,
  updateSubZone,
  updateZone,
} from "../services";
import handleError from "../utility/handleError";
import isEmptyStirng from "../utility/isEmptyStirng";
import PathConstants from "../routes/pathConstants";

const emptyZone = { identifier: "", name: "", description: "", notes: "" };
const emptySubZone = {
  identifier: "",
  name: "",
  zone: "",
  description: "",
  notes: "",
};

const Zones = () => {
  const [zones, setZones] = useState([]);
  const [subzones, setSubzones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zoneForm, setZoneForm] = useState(emptyZone);
  const [subzoneForm, setSubzoneForm] = useState(emptySubZone);
  const [editingZone, setEditingZone] = useState(null);
  const [editingSubZone, setEditingSubZone] = useState(null);
  const [loadError, setLoadError] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const [zoneResponse, subzoneResponse] = await Promise.all([
      getZones(),
      getSubZones(),
    ]);
    if (zoneResponse.status === 200) {
      setZones(zoneResponse.data || []);
    } else {
      setLoadError("Zones could not be loaded.");
    }
    if (subzoneResponse.status === 200) {
      setSubzones(subzoneResponse.data || []);
    } else {
      setLoadError("Zones could not be loaded.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const setZoneField = (field, value) => {
    setZoneForm((current) => ({ ...current, [field]: value }));
  };
  const setSubZoneField = (field, value) => {
    setSubzoneForm((current) => ({ ...current, [field]: value }));
  };

  const resetZoneForm = () => {
    setZoneForm(emptyZone);
    setEditingZone(null);
  };
  const resetSubZoneForm = () => {
    setSubzoneForm(emptySubZone);
    setEditingSubZone(null);
  };

  const handleZoneSubmit = async (event) => {
    event.preventDefault();
    if (isEmptyStirng(zoneForm.name)) {
      toast.error("Zone name is required.");
      return;
    }
    const payload = {
      identifier: zoneForm.identifier.trim() || zoneForm.name.trim(),
      name: zoneForm.name.trim(),
      description: zoneForm.description.trim(),
      notes: zoneForm.notes.trim(),
    };
    setSaving(true);
    const response = editingZone
      ? await updateZone(editingZone.id, payload)
      : await createZone(payload);
    setSaving(false);
    if (response.error) {
      handleError(response.error);
      return;
    }
    toast.success(editingZone ? "Zone updated." : "Zone created.");
    resetZoneForm();
    await loadAll();
  };

  const handleSubZoneSubmit = async (event) => {
    event.preventDefault();
    if (isEmptyStirng(subzoneForm.name)) {
      toast.error("Sub-zone name is required.");
      return;
    }
    if (!subzoneForm.zone) {
      toast.error("Please select a zone.");
      return;
    }
    const payload = {
      identifier: subzoneForm.identifier.trim() || subzoneForm.name.trim(),
      name: subzoneForm.name.trim(),
      zone: Number(subzoneForm.zone),
      description: subzoneForm.description.trim(),
      notes: subzoneForm.notes.trim(),
    };
    setSaving(true);
    const response = editingSubZone
      ? await updateSubZone(editingSubZone.id, payload)
      : await createSubZone(payload);
    setSaving(false);
    if (response.error) {
      handleError(response.error);
      return;
    }
    toast.success(editingSubZone ? "Sub-zone updated." : "Sub-zone created.");
    resetSubZoneForm();
    await loadAll();
  };

  const startEditZone = (zone) => {
    setEditingZone(zone);
    setZoneForm({
      identifier: zone.identifier || "",
      name: zone.name || "",
      description: zone.description || "",
      notes: zone.notes || "",
    });
  };

  const startEditSubZone = (subzone) => {
    setEditingSubZone(subzone);
    setSubzoneForm({
      identifier: subzone.identifier || "",
      name: subzone.name || "",
      zone: subzone.zone || "",
      description: subzone.description || "",
      notes: subzone.notes || "",
    });
  };

  const handleDeleteZone = async (zone) => {
    if (!window.confirm(`Delete zone "${zone.name}"? Its sub-zones will also be deleted.`)) {
      return;
    }
    const response = await deleteZone(zone.id);
    if (response.error) {
      handleError(response.error);
      return;
    }
    if (editingZone?.id === zone.id) resetZoneForm();
    toast.success("Zone deleted.");
    await loadAll();
  };

  const handleDeleteSubZone = async (subzone) => {
    if (!window.confirm(`Delete sub-zone "${subzone.name}"?`)) return;
    const response = await deleteSubZone(subzone.id);
    if (response.error) {
      handleError(response.error);
      return;
    }
    if (editingSubZone?.id === subzone.id) resetSubZoneForm();
    toast.success("Sub-zone deleted.");
    await loadAll();
  };

  const zoneName = (id) => zones.find((zone) => zone.id === id)?.name || "—";

  return (
    <div style={{ padding: "26px 30px 50px", maxWidth: "1200px", margin: "0 auto" }}>
      <Header as="h1" style={{ marginTop: 0 }}>
        Zones
        <Header.Subheader>
          Create the areas used to organise clients, resellers, POPs, TJ boxes
          and cables. Zones are shared by every map page.
        </Header.Subheader>
      </Header>

      {loadError && (
        <Message negative>
          <Message.Header>{loadError}</Message.Header>
          <Button size="small" onClick={loadAll}>
            Try again
          </Button>
        </Message>
      )}

      <Grid stackable columns={2}>
        <Grid.Column width={7}>
          <Segment>
            <Header as="h3">
              <Icon name="grid layout" />
              <Header.Content>
                {editingZone ? `Edit zone: ${editingZone.name}` : "Create a zone"}
              </Header.Content>
            </Header>
            <Form onSubmit={handleZoneSubmit}>
              <Form.Field>
                <label>Name</label>
                <input
                  placeholder="e.g. Dhaka"
                  value={zoneForm.name}
                  onChange={(event) => setZoneField("name", event.target.value)}
                />
              </Form.Field>
              <Form.Field>
                <label>Identifier (optional)</label>
                <input
                  placeholder="Short code"
                  value={zoneForm.identifier}
                  onChange={(event) =>
                    setZoneField("identifier", event.target.value)
                  }
                />
              </Form.Field>
              <Form.TextArea
                label="Description"
                value={zoneForm.description}
                onChange={(event) =>
                  setZoneField("description", event.target.value)
                }
              />
              <Form.TextArea
                label="Notes"
                value={zoneForm.notes}
                onChange={(event) => setZoneField("notes", event.target.value)}
              />
              <Button secondary type="submit" loading={saving}>
                {editingZone ? "Save changes" : "Add zone"}
              </Button>
              {editingZone && (
                <Button type="button" onClick={resetZoneForm}>
                  Cancel
                </Button>
              )}
            </Form>
          </Segment>
        </Grid.Column>

        <Grid.Column width={9}>
          <Segment>
            <Header as="h3">
              <Icon name="list" />
              <Header.Content>All zones</Header.Content>
            </Header>
            {loading ? (
              <Loader active inline="centered">
                Loading zones...
              </Loader>
            ) : zones.length === 0 ? (
              <Message info>No zones have been created yet.</Message>
            ) : (
              <Table compact celled selectable>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Name</Table.HeaderCell>
                    <Table.HeaderCell>Identifier</Table.HeaderCell>
                    <Table.HeaderCell>Sub-zones</Table.HeaderCell>
                    <Table.HeaderCell textAlign="right">Actions</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {zones.map((zone) => (
                    <Table.Row key={zone.id}>
                      <Table.Cell>
                        <strong>{zone.name}</strong>
                        {zone.description ? (
                          <div style={{ color: "#6b7280", fontSize: "12px" }}>
                            {zone.description}
                          </div>
                        ) : null}
                      </Table.Cell>
                      <Table.Cell>{zone.identifier || "—"}</Table.Cell>
                      <Table.Cell>
                        <Label basic>
                          {subzones.filter((sub) => sub.zone === zone.id).length}
                        </Label>
                      </Table.Cell>
                      <Table.Cell textAlign="right">
                        <Button
                          size="mini"
                          compact
                          onClick={() => startEditZone(zone)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="mini"
                          compact
                          color="red"
                          onClick={() => handleDeleteZone(zone)}
                        >
                          Delete
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            )}
          </Segment>
        </Grid.Column>
      </Grid>

      <Divider hidden />

      <Grid stackable columns={2}>
        <Grid.Column width={7}>
          <Segment>
            <Header as="h3">
              <Icon name="sitemap" />
              <Header.Content>
                {editingSubZone
                  ? `Edit sub-zone: ${editingSubZone.name}`
                  : "Create a sub-zone"}
              </Header.Content>
            </Header>
            {zones.length === 0 ? (
              <Message warning>
                Create a zone first, then you can add sub-zones inside it.
              </Message>
            ) : (
              <Form onSubmit={handleSubZoneSubmit}>
                <Form.Field>
                  <label>Name</label>
                  <input
                    placeholder="e.g. Gulshan"
                    value={subzoneForm.name}
                    onChange={(event) =>
                      setSubZoneField("name", event.target.value)
                    }
                  />
                </Form.Field>
                <Form.Field>
                  <label>Zone</label>
                  <select
                    value={subzoneForm.zone}
                    onChange={(event) =>
                      setSubZoneField("zone", event.target.value)
                    }
                  >
                    <option value="">Select a zone</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </Form.Field>
                <Form.Field>
                  <label>Identifier (optional)</label>
                  <input
                    placeholder="Short code"
                    value={subzoneForm.identifier}
                    onChange={(event) =>
                      setSubZoneField("identifier", event.target.value)
                    }
                  />
                </Form.Field>
                <Form.TextArea
                  label="Description"
                  value={subzoneForm.description}
                  onChange={(event) =>
                    setSubZoneField("description", event.target.value)
                  }
                />
                <Button secondary type="submit" loading={saving}>
                  {editingSubZone ? "Save changes" : "Add sub-zone"}
                </Button>
                {editingSubZone && (
                  <Button type="button" onClick={resetSubZoneForm}>
                    Cancel
                  </Button>
                )}
              </Form>
            )}
          </Segment>
        </Grid.Column>

        <Grid.Column width={9}>
          <Segment>
            <Header as="h3">
              <Icon name="list" />
              <Header.Content>All sub-zones</Header.Content>
            </Header>
            {loading ? (
              <Loader active inline="centered">
                Loading sub-zones...
              </Loader>
            ) : subzones.length === 0 ? (
              <Message info>No sub-zones have been created yet.</Message>
            ) : (
              <Table compact celled selectable>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Name</Table.HeaderCell>
                    <Table.HeaderCell>Zone</Table.HeaderCell>
                    <Table.HeaderCell>Identifier</Table.HeaderCell>
                    <Table.HeaderCell textAlign="right">Actions</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {subzones.map((subzone) => (
                    <Table.Row key={subzone.id}>
                      <Table.Cell>
                        <strong>{subzone.name}</strong>
                      </Table.Cell>
                      <Table.Cell>{zoneName(subzone.zone)}</Table.Cell>
                      <Table.Cell>{subzone.identifier || "—"}</Table.Cell>
                      <Table.Cell textAlign="right">
                        <Button
                          size="mini"
                          compact
                          onClick={() => startEditSubZone(subzone)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="mini"
                          compact
                          color="red"
                          onClick={() => handleDeleteSubZone(subzone)}
                        >
                          Delete
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            )}
          </Segment>
        </Grid.Column>
      </Grid>

      <Message info>
        Zones are now available from the main menu. Use{" "}
        <Link to={PathConstants.NETWORK_POINT}>Network Point</Link> to place
        clients, resellers, POPs, TJ boxes and cables on the map.
      </Message>
    </div>
  );
};

export default Zones;
