import {
  ModalHeader,
  ModalDescription,
  ModalContent,
  ModalActions,
  Button,
  Icon,
  Modal,
  TabPane,
  Tab,
  Segment,
} from "semantic-ui-react";
import CableEditTab from "./CableEditTab";
import CableDetailsTab from "./CableDetailsTab";
import CableCut from "./CableCut";
const CableModal = ({ cableId, polyline, numberOfCores, onClose }) => {
  const panes = [
    {
      menuItem: "Details",
      render: () => (
        <TabPane as={Segment}>
          <CableDetailsTab cableId={cableId} />
        </TabPane>
      ),
    },
    {
      menuItem: "Edit",
      render: () => (
        <TabPane attached={false} as={Segment} basic style={{ padding: 0 }}>
          <CableEditTab cableId={cableId} modalClose={onClose} />
        </TabPane>
      ),
    },
    {
      menuItem: "Cable Cut",
      render: () => (
        <TabPane attached={false} as={Segment}>
          <CableCut
            cableId={cableId}
            polyline={polyline}
            numberOfCores={numberOfCores}
            modalClose={onClose}
          />
        </TabPane>
      ),
    },
  ];
  return (
    <Modal open onClose={onClose} size="large">
      <ModalHeader>Cable </ModalHeader>
      <ModalContent>
        <ModalDescription>
          <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
        </ModalDescription>
      </ModalContent>
      <ModalActions>
        <Button onClick={onClose} secondary>
          Close <Icon name="chevron right" />
        </Button>
      </ModalActions>
    </Modal>
  );
};

export default CableModal;
