import React, { useEffect, useState } from "react";
import { createTJBox } from "../../services";
import { useDispatch, useSelector } from "react-redux";
import { mapActions } from "../../store/map/reducer";
import { updateTJBoxs } from "../../store/map/actions";
import {
  Grid,
  Header,
  Segment,
  Sidebar,
  Button,
  Icon,
  Form,
  Message,
} from "semantic-ui-react";
import isEmptyStirng from "../../utility/isEmptyStirng";
import handleError from "../../utility/handleError";
import { toast } from "react-toastify";
import { idOrNull } from "../../utility/mapUtils";
import useEscapeClose from "../../utility/useEscapeClose";
import ZoneFields from "../ZoneFields";

const AddTJBox = ({ show, setShow }) => {
  const dispatch = useDispatch();
  const latlang = useSelector((state) => state.map.latlang);

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [description, setDescription] = useState("");
  const branchFilter = useSelector((state) => state.map.branchFilter) || "";
  const zoneFilter = useSelector((state) => state.map.zoneFilter) || "";
  const [branch, setBranch] = useState(branchFilter);
  const [zone, setZone] = useState(zoneFilter);

  useEscapeClose(show, () => setShow(false));

  useEffect(() => {
    if (show) {
      setBranch(branchFilter);
      setZone(zoneFilter);
    }
  }, [show, branchFilter, zoneFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEmptyStirng(id)) {
      toast.error("Please enter Identifier");
      return;
    } else if (isEmptyStirng(name)) {
      toast.error("Please enter TJ Box name");
      return;
    } else if (isEmptyStirng(address)) {
      toast.error("Please enter address");
      return;
    } else if (latlang === null) {
      toast.error("Click on map to select location");
      return;
    }

    const data = {
      identifier: id,
      name: name,
      zone: idOrNull(branch),
      subzone: idOrNull(zone),
      marker: {
        type: "TJ_BOX",
        latitude: latlang.lat,
        longitude: latlang.lng,
        address: address,
        notes: note,
        description: description,
      },
    };

    const response = await createTJBox(data);
    if (response.status === 201) {
      dispatch(mapActions.updateLatLang(null));
      dispatch(updateTJBoxs());
      setShow(false);

      toast.success("TJ Box Created successfully");
      handleReset();
    }
    if (response.error) {
      handleError(response.error);
    }
  };
  const handleReset = () => {
    setId("");
    setName("");
    setAddress("");
    setNote("");
    setDescription("");
    setBranch(branchFilter);
    setZone(zoneFilter);
  };
  return (
    <Sidebar
      as={Segment}
      animation="overlay"
      vertical
      visible={show}
      direction="right"
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

              <Header.Content>Create Tj Box</Header.Content>
            </Header>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <Message info>Please click on the map to get coordinate </Message>
            <Form onSubmit={handleSubmit} onReset={handleReset} noValidate>
              <Form.Field required>
                <label>ID</label>
                <input
                  placeholder="Must be unique"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                />
              </Form.Field>
              <Form.Field required>
                <label>Name</label>
                <input
                  placeholder="TJ Box name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Form.Field>

              <Form.Field required>
                <label>Latitude</label>
                <input disabled value={latlang ? latlang.lat : ""} />
              </Form.Field>
              <Form.Field required>
                <label>Longitude</label>
                <input disabled value={latlang ? latlang.lng : ""} />
              </Form.Field>
              <Form.TextArea
                required
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

export default AddTJBox;
