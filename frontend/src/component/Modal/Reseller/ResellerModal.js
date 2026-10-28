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
import ResellerDetailsTab from "./ResellerDetailsTab";
import ResellerConnectionTab from "./ResellerConnectionTab";
import ResellerEdit from "./ResellerEdit";

const ResellerModal = ({ resellerId, onClose }) => {
  const panes = [
    {
      menuItem: "Paths",
      render: () => (
        <TabPane attached={false} as={Segment} basic style={{ padding: 0 }}>
          <ResellerDetailsTab resellerId={resellerId} modalClose={onClose} />
        </TabPane>
      ),
    },
    {
      menuItem: "Connection",
      render: () => (
        <TabPane attached={false} as={Segment} basic style={{ padding: 0 }}>
          <ResellerConnectionTab resellerId={resellerId} />
        </TabPane>
      ),
    },
    {
      menuItem: "Details",
      render: () => (
        <TabPane attached={false} as={Segment} basic style={{ padding: 0 }}>
          <ResellerEdit resellerId={resellerId} modalClose={onClose} />
        </TabPane>
      ),
    },
  ];

  return (
    <Modal open onClose={onClose} size="large">
      <ModalHeader>Reseller Details</ModalHeader>
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

export default ResellerModal;
