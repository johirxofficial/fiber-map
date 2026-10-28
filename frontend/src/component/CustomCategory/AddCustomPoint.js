import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Form,
  Grid,
  Header,
  Icon,
  Message,
  Segment,
  Sidebar,
} from "semantic-ui-react";
import { toast } from "react-toastify";
import { createCustomPoint } from "../../services";
import { mapActions } from "../../store/map/reducer";
import { updateCategories, updateCustomPoints } from "../../store/map/actions";
import handleError from "../../utility/handleError";
import isEmptyStirng from "../../utility/isEmptyStirng";
import { idOrNull } from "../../utility/mapUtils";
import useEscapeClose from "../../utility/useEscapeClose";
import ZoneFields from "../ZoneFields";

const AddCustomPoint = ({ category, show, setShow }) => {
  const dispatch = useDispatch();
  const latlang = useSelector((state) => state.map.latlang);
  const branchFilter = useSelector((state) => state.map.branchFilter) || "";
  const zoneFilter = useSelector((state) => state.map.zoneFilter) || "";

  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [description, setDescription] = useState("");
  const [branch, setBranch] = useState(branchFilter);
  const [zone, setZone] = useState(zoneFilter);

  useEscapeClose(show, () => setShow(false));

  useEffect(() => {
    if (show) {
      setBranch(branchFilter);
      setZone(zoneFilter);
    }
  }, [show, branchFilter, zoneFilter]);

  const reset = () => {
    setIdentifier("");
    setName("");
    setMobile("");
    setAddress("");
    setNote("");
    setDescription("");
    setBranch(branchFilter);
    setZone(zoneFilter);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isEmptyStirng(identifier)) {
      toast.error("Please enter an identifier");
      return;
    }
    if (isEmptyStirng(name)) {
      toast.error("Please enter a name");
      return;
    }
    if (!latlang) {
      toast.error("Tap Live location or click the map to select a location");
      return;
    }

    const response = await createCustomPoint({
      category: category.id,
      identifier,
      name,
      mobile_number: mobile,
      address,
      notes: note,
      description,
      latitude: latlang.lat,
      longitude: latlang.lng,
      zone: idOrNull(branch),
      subzone: idOrNull(zone),
    });

    if (response.status === 201) {
      dispatch(mapActions.updateLatLang(null));
      dispatch(updateCustomPoints());
      dispatch(updateCategories());
      setShow(false);
      reset();
      toast.success(`${category.label} record created`);
    } else if (response.error) {
      handleError(response.error);
    }
  };

  return (
    <Sidebar
      as={Segment}
      animation="overlay"
      vertical
      visible={show}
      direction="right"
      className="add-sidebar"
      style={{
        background: "#ffffff",
        width: "min(450px, 100%)",
        maxHeight: "100vh",
        overflowY: "auto",
        padding: "1rem",
      }}
    >
      <Grid padded>
        <Grid.Row>
          <Grid.Column>
            <Header as="h3" dividing>
              <Icon
                size="small"
                link
                name="close"
                aria-label="Close form"
                title="Close form (Esc)"
                onClick={() => setShow(false)}
              />
              <Header.Content>Create {category.label}</Header.Content>
            </Header>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <Message info>
              Tap <strong>Live location</strong> or click the map to capture the coordinate.
            </Message>
            <Form onSubmit={handleSubmit} onReset={reset} noValidate>
              <Form.Field required>
                <label>ID</label>
                <input
                  placeholder="Must be unique in this category"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </Form.Field>
              <Form.Field required>
                <label>Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </Form.Field>
              <Form.Field>
                <label>Mobile number</label>
                <input
                  placeholder="01XXXXXXXXX"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </Form.Field>
              <Form.Group widths="equal">
                <Form.Field required>
                  <label>Latitude</label>
                  <input value={latlang ? latlang.lat : ""} disabled />
                </Form.Field>
                <Form.Field required>
                  <label>Longitude</label>
                  <input value={latlang ? latlang.lng : ""} disabled />
                </Form.Field>
              </Form.Group>
              <Form.TextArea
                label="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Form.TextArea
                label="Note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Form.TextArea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <ZoneFields
                branch={branch}
                zone={zone}
                onBranchChange={(value) => {
                  setBranch(value);
                  setZone("");
                }}
                onZoneChange={setZone}
              />
              <Button secondary type="submit">
                Submit
              </Button>
              <Button color="red" type="reset">
                Clear
              </Button>
            </Form>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Sidebar>
  );
};

export default AddCustomPoint;
