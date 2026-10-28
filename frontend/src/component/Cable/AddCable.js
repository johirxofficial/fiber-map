import React, { useState } from "react";
import { createCable } from "../../services";
import { useDispatch, useSelector } from "react-redux";
import { mapActions } from "../../store/map/reducer";
import { updateCables } from "../../store/map/actions";
import {
  Grid,
  Header,
  Segment,
  Sidebar,
  Button,
  Icon,
  Form,
  Dropdown,
} from "semantic-ui-react";
import ModelDropDown from "../Dropdown/ModelDropDown";
import SearchModelDropdown from "../Dropdown/SearchModelDropdown";
import isEmptyStirng from "../../utility/isEmptyStirng";
import { toast } from "react-toastify";
import handleError from "../../utility/handleError";
import { validCoordinates } from "../../utility/mapUtils";
import useEscapeClose from "../../utility/useEscapeClose";

const cableOptions = [
  { key: "1", text: "Fiber", value: "FIBER" },
  { key: "2", text: "CAT 6", value: "CAT-6" },
  { key: "3", text: "Main Line", value: "MAIN_LINE" },
];
const coreOptions = [
  { key: "1", text: "2", value: "2" },
  { key: "2", text: "4", value: "4" },
  { key: "6", text: "6", value: "6" },
  { key: "3", text: "8", value: "8" },
  { key: "4", text: "12", value: "12" },
  { key: "5", text: "24", value: "24" },
  { key: "7", text: "48", value: "48" },
];

const AddCable = ({ visible }) => {
  const dispatch = useDispatch();
  const drawLine = useSelector((state) => state.map.drawLine);
  const pops = useSelector((state) => state.map.pops);
  const clients = useSelector((state) => state.map.clients);
  const tjboxs = useSelector((state) => state.map.tjboxs);
  const resellers = useSelector((state) => state.map.resellers);
  const [id, setId] = useState("");

  const [cableType, setCableType] = useState("");
  const [core, setCore] = useState("");
  const [startFrom, setStartFrom] = useState("");
  const [startingPoint, setStartingPoint] = useState("");
  const [endFrom, setEndFrom] = useState("");
  const [endingPoint, setEndingPoint] = useState("");
  const [length, setLength] = useState("");
  const [note, setNote] = useState("");
  const [description, setDescription] = useState("");
  const [formVersion, setFormVersion] = useState(0);

  useEscapeClose(visible, () => dispatch(mapActions.setDrawLine(null)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEmptyStirng(id)) {
      toast.error("Please enter Identifier");
      return;
    } else if (isEmptyStirng(cableType)) {
      toast.error("Please select cable type");
      return;
    } else if (core === "") {
      toast.error("Please select cable core");
      return;
    } else if (isEmptyStirng(startFrom)) {
      toast.error("Please select start from");
      return;
    } else if (!startingPoint) {
      toast.error("Please select starting point");
      return;
    } else if (isEmptyStirng(endFrom)) {
      toast.error("Please select end from");
      return;
    } else if (!endingPoint) {
      toast.error("Please select ending point");
      return;
    } else if (isEmptyStirng(length)) {
      toast.error("Please enter cable length in meters");
      return;
    }
    try {
      const models = {
        POP: Array.isArray(pops) ? pops : [],
        CLIENT: Array.isArray(clients) ? clients : [],
        TJ_BOX: Array.isArray(tjboxs) ? tjboxs : [],
        RESELLER: Array.isArray(resellers) ? resellers : [],
      };
      const startingModel = models[startFrom]?.find(
        (item) => item.id === Number(startingPoint)
      );
      const endingModel = models[endFrom]?.find(
        (item) => item.id === Number(endingPoint)
      );
      const points = (Array.isArray(drawLine) ? drawLine : []).map((point) => ({
        lat: Number(point.lat),
        lng: Number(point.lng),
      }));
      if (points.length < 2) {
        toast.error("Please draw a line on the map for this cable");
        return;
      }
      // Snap the two ends to the selected models.  A user never clicks the
      // exact centre of a marker, and the API requires the drawn line to start
      // and end at the selected models.
      if (
        startingModel &&
        validCoordinates(startingModel.latitude, startingModel.longitude)
      ) {
        points[0] = {
          lat: Number(startingModel.latitude),
          lng: Number(startingModel.longitude),
        };
      }
      if (
        endingModel &&
        validCoordinates(endingModel.latitude, endingModel.longitude)
      ) {
        points[points.length - 1] = {
          lat: Number(endingModel.latitude),
          lng: Number(endingModel.longitude),
        };
      }

      const data = {
        identifier: id,
        type: cableType,
        start_from: startFrom,
        starting_point: startingPoint,
        end_to: endFrom,
        ending_point: endingPoint,
        number_of_cores: core,
        length: length,
        notes: note,
        description: description,
        polyline: points,
      };

      const response = await createCable(data);
      if (response.status === 201) {
        dispatch(mapActions.setDrawLine(null));
        dispatch(updateCables());
        toast.success("Cable created successfully");
        handleReset();
      }
      if (response.error) {
        handleError(response.error);
      }
    } catch (error) {
      handleError(error);
    }
  };
  const handleReset = () => {
    setId("");
    setCableType("");
    setCore("");
    setStartFrom("");
    setStartingPoint(null);
    setEndFrom("");
    setEndingPoint(null);
    setLength("");
    setNote("");
    setDescription("");
    setFormVersion((version) => version + 1);
  };

  return (
    <Sidebar
      as={Segment}
      animation="overlay"
      vertical
      visible={visible}
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
                onClick={() => dispatch(mapActions.setDrawLine(null))}
              />

              <Header.Content>Create Cable</Header.Content>
            </Header>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <Form key={formVersion} onSubmit={handleSubmit} onReset={handleReset}>
              <Form.Field required>
                <label>Cable ID</label>
                <input
                  placeholder="Must be unique"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                />
              </Form.Field>
              <Form.Field required>
                <label>Type</label>
                <Dropdown
                  fluid
                  selection
                  options={cableOptions}
                  value={cableType}
                  onChange={(e, { value }) => setCableType(value)}
                />
              </Form.Field>
              <Form.Field required>
                <label>Start from</label>
                <ModelDropDown
                  getValue={(value) => {
                    setStartFrom(value);
                    setStartingPoint(null);
                  }}
                />
              </Form.Field>
              <Form.Field required>
                <label>Starting Point</label>
                <SearchModelDropdown
                  getValue={setStartingPoint}
                  optionsType={startFrom}
                />
              </Form.Field>
              <Form.Field required>
                <label>End from</label>
                <ModelDropDown
                  getValue={(value) => {
                    setEndFrom(value);
                    setEndingPoint(null);
                  }}
                />
              </Form.Field>
              <Form.Field required>
                <label>Ending Point</label>
                <SearchModelDropdown
                  getValue={setEndingPoint}
                  optionsType={endFrom}
                />
              </Form.Field>
              <Form.Field required>
                <label>Core</label>
                <Dropdown
                  fluid
                  selection
                  options={coreOptions}
                  value={core}
                  onChange={(e, { value }) => setCore(value)}
                />
              </Form.Field>
              <Form.Field required>
                <label>Length (meter)</label>
                <input
                  placeholder="10"
                  onChange={(e) => setLength(e.target.value)}
                  value={length}
                />
              </Form.Field>
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

export default React.memo(AddCable);
