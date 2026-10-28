import PopConnectionTab from "./PopConnectionTab";
import PopDetailsTab from "./PopDetailsTab";
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
import PopEdit from "./PopEdit";

const PopModal = ({ popId, popType, onClose }) => {
  const panes = [
    {
      menuItem: "Paths",
      render: () => (
        <TabPane attached={false} as={Segment} basic style={{ padding: 0 }}>
          <PopDetailsTab popId={popId} modalClose={onClose} />
        </TabPane>
      ),
    },
    {
      menuItem: "Connection",
      render: () => (
        <TabPane attached={false} as={Segment} basic style={{ padding: 0 }}>
          <PopConnectionTab popId={popId} />
        </TabPane>
      ),
    },
    {
      menuItem: "Details",
      render: () => (
        <TabPane attached={false} as={Segment} basic style={{ padding: 0 }}>
          <PopEdit popId={popId} modalClose={onClose} />
        </TabPane>
      ),
    },
  ];

  return (
    <Modal open onClose={onClose} size="large">
      <ModalHeader>{popType} Details</ModalHeader>
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

export default PopModal;
