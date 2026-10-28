import { Link } from "react-router-dom";
import { Button, Header, Message, Segment } from "semantic-ui-react";
import PathConstants from "../routes/pathConstants";

export default function Page404() {
  return (
    <div style={{ maxWidth: "720px", margin: "40px auto", padding: "0 18px" }}>
      <Segment padded="very">
        <Header as="h1" textAlign="center">
          404 - Page Not Found
          <Header.Subheader>
            The address does not exist. Use one of the links below to continue.
          </Header.Subheader>
        </Header>
        <Message info>
          Every page now shares the same menu, so you can also use the menu at
          the top of the screen.
        </Message>
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Button primary as={Link} to={PathConstants.DASHBOARD}>
            Dashboard
          </Button>
          <Button as={Link} to={PathConstants.NETWORK_POINT}>
            Network Point
          </Button>
          <Button as={Link} to={PathConstants.ZONES}>
            Zones
          </Button>
          <Button as="a" href="/management/?tab=users">
            Users &amp; permissions
          </Button>
          <Button as="a" href="/management/">
            Management
          </Button>
        </div>
      </Segment>
    </div>
  );
}
