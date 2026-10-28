import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Button, Confirm, Form } from "semantic-ui-react";
import { getTJBox, updateTJBox, deleteTJBox } from "../../../services";
import handleError from "../../../utility/handleError";
import {
  updateCables,
  updateGpons,
  updateTJBoxs,
} from "../../../store/map/actions";
import { useDispatch } from "react-redux";
import { idOrNull } from "../../../utility/mapUtils";
import ZoneFields from "../../ZoneFields";

const TJBoxDetailsTab = ({ tjboxId, modalClose }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const nameInputRef = useRef();
  const addressInputRef = useRef();
  const notesInputRef = useRef();
  const descriptionInputRef = useRef();
  const [branch, setBranch] = useState("");
  const [zone, setZone] = useState("");

  const [confirmSubmit, setConfirmSubmit] = useState(false);

  useEffect(() => {
    getTJBoxDetails(tjboxId);
  }, []);

  const getTJBoxDetails = async (id) => {
    const { data, status, error } = await getTJBox(id);
    if (status === 200) {
      nameInputRef.current.value = data.name;
      addressInputRef.current.value = data.marker.address;
      notesInputRef.current.value = data.marker.notes;
      descriptionInputRef.current.value = data.marker.description;
      setBranch(data.zone ? String(data.zone) : "");
      setZone(data.subzone ? String(data.subzone) : "");
    }
    if (error) {
      handleError(error);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    nameInputRef.current.focus();
    toast.info("You can now edit the Tj Box details.");
  };

  const handleSave = async () => {
    const payload = {
      name: nameInputRef.current.value,
      zone: idOrNull(branch),
      subzone: idOrNull(zone),
      marker: {
        address: addressInputRef.current.value,
        notes: notesInputRef.current.value,
        description: descriptionInputRef.current.value,
      },
    };
    const response = await updateTJBox(tjboxId, payload);
    if (response.status === 200) {
      setIsEditing(false);
      toast.success("TJ Box details updated successfully.");
      dispatch(updateTJBoxs());
      dispatch(updateCables());
    }
    if (response.error) {
      handleError(response.error);
    }
  };
  const handleDelete = async () => {
    const response = await deleteTJBox(tjboxId);
    if (response.status === 204) {
      modalClose();
      toast.success("TJ Box deleted successfully.");

      dispatch(updateTJBoxs());
      dispatch(updateCables());
      dispatch(updateGpons());
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
          <label>TJ Box Name</label>
          <input name="name" readOnly={!isEditing} ref={nameInputRef} />
        </Form.Field>
      </Form.Group>
      <Form.Field>
        <label>Address</label>
        <input name="address" ref={addressInputRef} readOnly={!isEditing} />
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
      <ZoneFields
        branch={branch}
        zone={zone}
        disabled={!isEditing}
        onBranchChange={(value) => {
          setBranch(value);
          setZone("");
        }}
        onZoneChange={setZone}
      />
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
export default TJBoxDetailsTab;
