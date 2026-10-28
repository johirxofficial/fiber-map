import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Button, Confirm, Dropdown, Form } from "semantic-ui-react";
import {
  deleteCable,
  getCableDetails,
  updateCableDetails,
} from "../../../services";
import handleError from "../../../utility/handleError";
import { updateCables } from "../../../store/map/actions";
import { useDispatch } from "react-redux";

const cableTypeOptions = [
  { key: "1", text: "Fiber", value: "FIBER" },
  { key: "2", text: "CAT 6", value: "CAT-6" },
  { key: "3", text: "Main Line", value: "MAIN_LINE" },
];

const CableEditTab = ({ cableId, modalClose }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const idInputRef = useRef();
  const lengthInputRef = useRef();
  const notesInputRef = useRef();
  const descriptionInputRef = useRef();
  const [cableType, setCableType] = useState("");

  const [confirmSubmit, setConfirmSubmit] = useState(false);

  useEffect(() => {
    getCable();
  }, []);

  const getCable = async () => {
    const { data, status, error } = await getCableDetails(cableId);
    if (status === 200) {
      idInputRef.current.value = data.identifier;
      lengthInputRef.current.value = data.length;
      notesInputRef.current.value = data.notes;
      descriptionInputRef.current.value = data.description;
      setCableType(data.type);
    }
    if (error) {
      handleError(error);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    idInputRef.current.focus();
    toast.info("You can now edit the cable details.");
  };

  const handleSave = async () => {
    const payload = {
      identifier: idInputRef.current.value,
      type: cableType,
      length: lengthInputRef.current.value,
      notes: notesInputRef.current.value,
      description: descriptionInputRef.current.value,
    };
    const response = await updateCableDetails(cableId, payload);
    if (response.status === 200) {
      setIsEditing(false);
      toast.success("Cable details updated successfully.");
      dispatch(updateCables());
    }
    if (response.error) {
      handleError(response.error);
    }
  };

  const handleDelete = async () => {
    const response = await deleteCable(cableId);
    if (response.status === 204) {
      modalClose();
      toast.success("Cable deleted successfully.");

      dispatch(updateCables());
    }
    if (response.error) {
      handleError(response.error);
    }
  };
  const handleConfirm = () => {
    setConfirmSubmit(false);
    handleDelete();
  };
  const showConfirmSubmit = () => {
    setConfirmSubmit(true);
  };

  return (
    <Form>
      <Form.Group widths="equal">
        <Form.Field>
          <label>ID</label>
          <input readOnly={!isEditing} ref={idInputRef} />
        </Form.Field>
        <Form.Field>
          <label>Type</label>
          <Dropdown
            fluid
            options={cableTypeOptions}
            selection
            value={cableType}
            onChange={(e, { value }) => {
              setCableType(value);
            }}
            disabled={!isEditing}
          />
        </Form.Field>
      </Form.Group>
      <Form.Field>
        <label>Length</label>
        <input ref={lengthInputRef} readOnly={!isEditing} />
      </Form.Field>
      <Form.Field>
        <label>Notes</label>
        <textarea
          name="notes"
          readOnly={!isEditing}
          ref={notesInputRef}
          rows={3}
        />
      </Form.Field>
      <Form.Field>
        <label>Description</label>

        <textarea
          name="description"
          ref={descriptionInputRef}
          readOnly={!isEditing}
          rows={3}
        />
      </Form.Field>
      <Form.Group widths="equal">
        {isEditing ? (
          <Button fluid secondary onClick={handleSave}>
            Save
          </Button>
        ) : (
          <Button fluid secondary onClick={handleEditClick}>
            Edit
          </Button>
        )}
        <Button fluid color="red" onClick={showConfirmSubmit}>
          Delete
        </Button>
      </Form.Group>
      <Confirm
        className="secondary"
        open={confirmSubmit}
        cancelButton="No"
        confirmButton="Yes"
        onCancel={() => setConfirmSubmit(false)}
        onConfirm={handleConfirm}
      />
    </Form>
  );
};
export default CableEditTab;
