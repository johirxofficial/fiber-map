import { useState } from "react";
import { toast } from "react-toastify";
import { Button, Dropdown, Form } from "semantic-ui-react";
import { useDispatch } from "react-redux";
import isEmptyStirng from "../../../utility/isEmptyStirng";
import { createGpon } from "../../../services";
import handleError from "../../../utility/handleError";
import { updateGpons, updateTJBoxs } from "../../../store/map/actions";

const splitterTypeOptions = [
  { key: 1, text: "Epon", value: "Epon" },
  { key: 2, text: "Gpon", value: "Gpon" },
];

const splitterOptions = [
  { key: 1, text: "2", value: 2 },
  { key: 2, text: "4", value: 4 },
  { key: 3, text: "8", value: 8 },
  { key: 4, text: "12", value: 12 },
  { key: 5, text: "16", value: 16 },
  { key: 6, text: "32", value: 32 },
];
const TJBoxCreateSplitterTab = ({ tjboxId, onCreated }) => {
  const dispatch = useDispatch();
  const [splitter, setSplitter] = useState(2);

  const [splitterType, setSplitterType] = useState("");
  const handleCreateSplitter = async () => {
    if (isEmptyStirng(splitterType)) {
      toast.error("Please enter gpon type");
      return;
    }

    const data = {
      name: splitterType,
      splitter: splitter,
      tj_box: tjboxId,
    };

    const response = await createGpon(data);
    if (response.status === 201) {
      toast.success("Splitter created successfully");
      dispatch(updateGpons());
      dispatch(updateTJBoxs());
      handleReset();
      if (typeof onCreated === "function") onCreated();
    }
    if (response.error) {
      handleError(response.error);
    }
  };

  const handleReset = () => {
    setSplitterType("");
    setSplitter(2);
  };
  return (
    <Form>
      <Form.Field>
        <label>Type</label>
        <Dropdown
          fluid
          options={splitterTypeOptions}
          selection
          value={splitterType}
          onChange={(e, { value }) => {
            setSplitterType(value);
          }}
        />
      </Form.Field>
      <Form.Field required>
        <label>Splitter</label>
        <Dropdown
          fluid
          onChange={(e, { value }) => {
            setSplitter(value);
          }}
          options={splitterOptions}
          selection
          value={splitter}
        />
      </Form.Field>

      <Form.Group>
        <Button fluid color="green" onClick={handleCreateSplitter}>
          Create
        </Button>
      </Form.Group>
    </Form>
  );
};

export default TJBoxCreateSplitterTab;
