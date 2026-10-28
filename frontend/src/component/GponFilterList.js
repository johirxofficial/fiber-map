import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Grid,
  Icon,
  Input,
  List,
  Loader,
  Message,
  Segment,
} from "semantic-ui-react";
import TJBoxModal from "./Modal/TJBox/TJBoxModal";
import { useMapContext } from "../contexts/map-context";
import {
  branchZoneLabel,
  flyToMarker,
  matchesBranchZone,
  matchesSearch,
} from "../utility/mapUtils";

/**
 * Read-only GPON splitter list shown by the ?category=GPON dashboard link.
 * Splitters are created from a TJ Box, so this view deliberately has no Add
 * form; clicking a row opens the TJ Box details where its splitters live.
 */
const GponFilterList = () => {
  const gpons = useSelector((state) => state.map.gpons);
  const branches = useSelector((state) => state.map.branches);
  const zones = useSelector((state) => state.map.zones);
  const branchFilter = useSelector((state) => state.map.branchFilter);
  const zoneFilter = useSelector((state) => state.map.zoneFilter);
  const { map } = useMapContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTjBoxId, setSelectedTjBoxId] = useState(null);

  const filteredGpons = useMemo(
    () =>
      (Array.isArray(gpons) ? gpons : []).filter(
        (gpon) =>
          (matchesSearch(gpon.identifier, searchTerm) ||
            matchesSearch(gpon.name, searchTerm) ||
            matchesSearch(gpon.address, searchTerm)) &&
          matchesBranchZone(gpon, branchFilter, zoneFilter)
      ),
    [gpons, branchFilter, zoneFilter, searchTerm]
  );

  return (
    <Grid>
      {selectedTjBoxId ? (
        <TJBoxModal
          tjboxId={selectedTjBoxId}
          onClose={() => setSelectedTjBoxId(null)}
        />
      ) : null}
      <Grid.Row style={{ marginTop: "20px" }}>
        <Grid.Column>
          <Input
            fluid
            placeholder="Search GPON splitters..."
            value={searchTerm}
            icon={
              <Icon
                name="close"
                size="small"
                link
                onClick={() => setSearchTerm("")}
              />
            }
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <Grid.Column>
          {gpons === null ? (
            <Loader active inline="centered" size="small">
              Loading GPON splitters...
            </Loader>
          ) : filteredGpons.length === 0 ? (
            <Message info>
              No GPON splitters found. Open a TJ Box and use the Create
              Splitter tab to add one.
            </Message>
          ) : (
            <List divided relaxed style={{ overflow: "auto", maxHeight: "45vh" }}>
              {filteredGpons.map((gpon) => (
                <List.Item
                  key={`gpon-${gpon.id}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    flyToMarker(map, gpon.latitude, gpon.longitude);
                    if (gpon.tj_box) {
                      setSelectedTjBoxId(gpon.tj_box);
                    }
                  }}
                >
                  <List.Icon
                    name="sitemap"
                    size="large"
                    verticalAlign="middle"
                    color="purple"
                  />
                  <List.Content>
                    <List.Header>{gpon.identifier || gpon.name}</List.Header>
                    <List.Description>
                      {gpon.name ? `${gpon.name} · ` : ""}
                      {gpon.splitter} way splitter
                    </List.Description>
                    {branchZoneLabel(gpon, branches, zones) ? (
                      <List.Description>
                        {branchZoneLabel(gpon, branches, zones)}
                      </List.Description>
                    ) : null}
                  </List.Content>
                </List.Item>
              ))}
            </List>
          )}
          <Segment basic secondary style={{ padding: "8px 0 0" }}>
            <Icon name="info circle" /> Click a splitter to open its TJ Box.
          </Segment>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
};

export default GponFilterList;
