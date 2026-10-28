import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Grid,
  Header,
  Icon,
  Loader,
  Message,
  Segment,
} from "semantic-ui-react";
import { fetchDashboardData } from "../services";
import PathConstants from "../routes/pathConstants";

const cards = [
  {
    key: "total_clients",
    label: "Clients",
    icon: "users",
    color: "blue",
    to: `${PathConstants.NETWORK_POINT}?category=CLIENT`,
  },
  {
    key: "total_resellers",
    label: "Resellers",
    icon: "shop",
    color: "teal",
    to: `${PathConstants.NETWORK_POINT}?category=RESELLER`,
  },
  {
    key: "total_gpons",
    label: "GPON Splitters",
    icon: "sitemap",
    color: "purple",
    to: `${PathConstants.NETWORK_POINT}?category=GPON`,
  },
  {
    key: "total_tj_boxes",
    label: "TJ Boxes",
    icon: "inbox",
    color: "orange",
    to: `${PathConstants.NETWORK_POINT}?category=TJ_BOX`,
  },
  {
    key: "total_pop",
    label: "POPs",
    icon: "building",
    color: "green",
    to: `${PathConstants.NETWORK_POINT}?category=POP`,
  },
  {
    key: "total_cables",
    label: "Cables",
    icon: "code branch",
    color: "grey",
    to: `${PathConstants.NETWORK_POINT}?category=CABLE`,
  },
];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const response = await fetchDashboardData();
    if (response.status === 200) {
      setData(response.data);
    } else {
      setError("Dashboard data could not be loaded. Please try again.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ padding: "26px 30px 50px", maxWidth: "1200px", margin: "0 auto" }}>
      <Header as="h1" style={{ marginTop: 0 }}>
        Dashboard
        <Header.Subheader>
          Overview of the optical fiber network stored in this installation.
        </Header.Subheader>
      </Header>

      {error && (
        <Message negative>
          <Message.Header>Unable to load the dashboard</Message.Header>
          <p>{error}</p>
          <Button size="small" onClick={load}>
            Try again
          </Button>
        </Message>
      )}

      {loading ? (
        <Segment padded="very" textAlign="center">
          <Loader active inline="centered">
            Loading dashboard...
          </Loader>
        </Segment>
      ) : (
        <>
          <Grid stackable columns={3}>
            {cards.map((card) => (
              <Grid.Column key={card.key} mobile={16} tablet={8} computer={5}>
                <Segment
                  as={Link}
                  to={card.to}
                  raised
                  style={{ display: "block", color: "inherit" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "#6b7280",
                          fontSize: "13px",
                          fontWeight: 700,
                          letterSpacing: ".03em",
                          textTransform: "uppercase",
                        }}
                      >
                        {card.label}
                      </div>
                      <div
                        style={{
                          color: "#111827",
                          fontSize: "34px",
                          fontWeight: 700,
                          lineHeight: 1.35,
                        }}
                      >
                        {data?.[card.key] ?? 0}
                      </div>
                    </div>
                    <Icon name={card.icon} color={card.color} size="big" />
                  </div>
                </Segment>
              </Grid.Column>
            ))}
          </Grid>

          <Segment style={{ marginTop: "18px" }}>
            <Header as="h3">Quick links</Header>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Button secondary as={Link} to={PathConstants.NETWORK_POINT}>
                <Icon name="map outline" /> Open Network Point
              </Button>
              <Button as="a" href="/management/?tab=zones">
                <Icon name="grid layout" /> Branches &amp; Zones
              </Button>
              <Button as="a" href="/management/?tab=users">
                <Icon name="user plus" /> Users &amp; permissions
              </Button>
              <Button as="a" href="/management/">
                <Icon name="settings" /> Management
              </Button>
            </div>
          </Segment>

          <Message info>
            Use <strong>Network Point</strong> to add clients, POPs, TJ boxes,
            resellers and cables on the map. Open <strong>Management → Branches
            &amp; Zones</strong> to organise the network into branches and zones.
          </Message>
        </>
      )}
    </div>
  );
};

export default Dashboard;
