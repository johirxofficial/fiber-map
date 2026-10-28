import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Button, Confirm, Form, Input, Segment } from "semantic-ui-react";
import { deleteReseller, getReseller, updateReseller } from "../../../services";
import handleError from "../../../utility/handleError";
import { updateCables, updateResellers } from "../../../store/map/actions";
import { useDispatch } from "react-redux";
import { idOrNull } from "../../../utility/mapUtils";
import ZoneFields from "../../ZoneFields";

const ResellerEdit = ({ resellerId, modalClose }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const nameInputRef = useRef();
  const addressInputRef = useRef();
  const notesInputRef = useRef();
  const descriptionInputRef = useRef();
  const mobileInputRef = useRef();
  const [branch, setBranch] = useState("");
  const [zone, setZone] = useState("");
  const [latLng, setLatLng] = useState("");

  const [confirmSubmit, setConfirmSubmit] = useState(false);

  useEffect(() => {
    getResellerDetails(resellerId);
  }, []);

  const getResellerDetails = async (id) => {
    const { data, status, error } = await getReseller(id);
    if (status === 200) {
      nameInputRef.current.value = data.name;
      addressInputRef.current.value = data.marker.address;
      notesInputRef.current.value = data.marker.notes;
      descriptionInputRef.current.value = data.marker.description;
      mobileInputRef.current.value = data.mobile_number;
      setBranch(data.zone ? String(data.zone) : "");
      setZone(data.subzone ? String(data.subzone) : "");
      setLatLng(`[${data.marker.latitude}, ${data.marker.longitude}]`);
    }
    if (error) {
      handleError(error);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    nameInputRef.current.focus();
    toast.info("You can now edit the reseller details.");
  };

  const handleSave = async () => {
    const payload = {
      name: nameInputRef.current.value,
      mobile_number: mobileInputRef.current.value,
      zone: idOrNull(branch),
      subzone: idOrNull(zone),
      marker: {
        address: addressInputRef.current.value,
        notes: notesInputRef.current.value,
        description: descriptionInputRef.current.value,
      },
    };
    const response = await updateReseller(resellerId, payload);
    if (response.status === 200) {
      setIsEditing(false);
      toast.success("Reseller details updated successfully.");
      dispatch(updateResellers());
    }
    if (response.error) {
      handleError(response.error);
    }
  };

  const handleDelete = async () => {
    const response = await deleteReseller(resellerId);
    if (response.status === 204) {
      modalClose();
      toast.success("Reseller deleted successfully.");

      dispatch(updateResellers());
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
      <Form.Field>
        <Segment secondary>
          <Input
            readOnly
            action={{
              color: "primary",
              labelPosition: "right",
              icon: "copy",
              content: "Copy",
              onClick: () => {
                navigator.clipboard.writeText(latLng);
                toast.success("Copied to clipboard");
              },
            }}
            value={`latitude and longitude : ${latLng}`}
          />
        </Segment>
      </Form.Field>
      <Form.Group widths="equal">
        <Form.Field>
          <label>Reseller Name</label>
          <input name="name" readOnly={!isEditing} ref={nameInputRef} />
        </Form.Field>
        <Form.Field>
          <label>Mobile number</label>
          <input name="mobile" readOnly={!isEditing} ref={mobileInputRef} />
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
export default ResellerEdit;
