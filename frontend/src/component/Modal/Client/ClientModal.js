import ClientConnectionTab from "./ClientConnectionTab";
import ClientDetailsTab from "./ClientDetailsTab";
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
import ClientEdit from "./ClientEdit";

const ClientModal = ({ clientId, onClose }) => {
  const panes = [
    {
      menuItem: "Paths",
      render: () => (
        <TabPane attached={false} as={Segment} basic style={{ padding: 0 }}>
          <ClientDetailsTab clientId={clientId} modalClose={onClose} />
        </TabPane>
      ),
    },
    {
      menuItem: "Connection",
      render: () => (
        <TabPane attached={false} as={Segment} basic style={{ padding: 0 }}>
          <ClientConnectionTab clientId={clientId} />
        </TabPane>
      ),
    },
    {
      menuItem: "Details",
      render: () => (
        <TabPane attached={false} as={Segment} basic style={{ padding: 0 }}>
          <ClientEdit clientId={clientId} modalClose={onClose} />
        </TabPane>
      ),
    },
  ];

  return (
    <Modal open onClose={onClose} size="large">
      <ModalHeader>Client Details</ModalHeader>
      <ModalContent scrolling>
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

export default ClientModal;
