import React, { useEffect, useState } from "react";
import { getTJBoxCoreDetails } from "../../../services";
import { connectCores, disconnectCores } from "../../../services";
import {
  Grid,
  GridRow,
  GridColumn,
  Segment,
  Message,
  Button,
  SegmentGroup,
  Header,
} from "semantic-ui-react";

import banglaColorMap from "../../../utility/banglaColorMap";

const TJBoxConnectionTab = ({ tjboxId, setLoading, refreshToken = 0 }) => {
  const [cableDetails, setCableDetails] = useState(null);
  const [splitterDetails, setSplitterDetails] = useState(null);
  const [connection, setConnection] = useState({
    left: null,
    right: null,
  });
  const [highlight, setHighlight] = useState([]);
  const [disableButtonList, setDisableButtonList] = useState([]);
  // const [connection, setConnection] = useState({
  //   left: { cableIdentifier: null, coreId: null, color: null },
  //   right: { cableIdentifier: null, coreId: null, color: null },
  // });
  useEffect(() => {
    getCoreDetails(tjboxId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tjboxId, refreshToken]);

  const getCoreDetails = async (id) => {
    setLoading(true);
    try {
      const { data, status } = await getTJBoxCoreDetails(id);
      if (status === 200) {
        setCableDetails(data.cables || []);
        setSplitterDetails(data.splitters || []);
      }
    } catch (error) {
      setCableDetails([]);
      setSplitterDetails([]);
    } finally {
      setLoading(false);
    }
  };
  const onConnect = async () => {
    if (!connection.left || !connection.right) {
      return;
    }
    const payload = {
      core_from: connection.left.coreId,
      core_to: connection.right.coreId,
    };
    try {
      const { status } = await connectCores(payload);
      if (status === 201) {
        getCoreDetails(tjboxId);
        onReset();
      }
    } catch (error) {
      return { data: null, status: null, error };
    }
  };

  const onRemove = async (coreFrom, coreTo) => {
    const payload = {
      core_from: coreFrom,
      core_to: coreTo,
    };
    try {
      const { status } = await disconnectCores(payload);
      if (status === 204) {
        onReset();
        getCoreDetails(tjboxId);
      }
    } catch (error) {
      return { data: null, status: null, error };
    }
  };

  const onSelect = async (data, splitterCores = null) => {
    if (connection.left && connection.right) {
      return;
    }
    if (!connection.left) {
      setConnection((prev) => ({ ...prev, left: data }));
    } else {
      setConnection((prev) => ({ ...prev, right: data }));
    }
    if (splitterCores) {
      const cores = [];
      (splitterDetails || []).forEach((splitter) => {
        (splitter.output_cores || []).forEach((core) => {
          if (
            (data.coreNumber === 0 && core.core_number === 0) ||
            (data.coreNumber !== 0 && core.core_number !== 0)
          ) {
            cores.push(core.id);
          }
        });
      });
      splitterCores.forEach((core) => cores.push(core.id));
      setDisableButtonList((prev) => [...prev, ...cores]);
    } else {
      const cable = (cableDetails || []).find(
        (cable) => cable.id === data.cableId
      );
      if (!cable) return;
      const cores = (cable.cores || []).map((core) => core.id);
      setDisableButtonList((prev) => [...prev, ...cores]);
    }
  };
  const onReset = () => {
    setDisableButtonList([]);
    setHighlight([]);
    setConnection({
      left: null,
      right: null,
    });
  };

  const highlightConnectedCore = async (core) => {
    if (!core.connected_to) return;
    setHighlight([core.connected_to.id, core.id]);
  };

  return (
    <>
      {connection.left && (
        <Segment textAlign="center">
          <SegmentGroup horizontal>
            <Segment>
              <Header as="h4">
                {connection.left &&
                  connection.left.cableIdentifier &&
                  `Cable ID: ${connection.left.cableIdentifier} | Core : ${
                    banglaColorMap[connection.left.color]
                  }`}
                {connection.left &&
                  !connection.left.cableIdentifier &&
                  `Splitter core: ${connection.left.coreNumber}`}
              </Header>
            </Segment>
            <Segment>----- Connected with -----</Segment>
            <Segment secondary>
              <Header as="h4" disabled={connection.right ? false : true}>
                {connection.right
                  ? connection.right.cableIdentifier
                    ? `Cable ID: ${connection.right.cableIdentifier} | Core : ${
                        banglaColorMap[connection.right.color]
                      }`
                    : `Splitter core: ${connection.right.coreNumber}`
                  : "SELECT ANOTHER TO CONNECT"}
              </Header>
            </Segment>
          </SegmentGroup>
          {connection.left && connection.right && (
            <Button positive onClick={onConnect}>
              Connect
            </Button>
          )}
          <Button negative onClick={onReset}>
            Reset
          </Button>
        </Segment>
      )}
      <Grid columns={2}>
        {cableDetails?.map((cable, index) => (
          <GridRow key={index}>
            <GridColumn width={5}>
              <Message attached header="cable details" />
              <Segment attached>
                <p>
                  <b>CABLE ID : </b> {cable.identifier}
                </p>
                <p>
                  <b>Total Core : </b>
                  {cable.number_of_cores}
                </p>
                <p>
                  <b>Cable length : </b>
                  {cable.length}
                </p>
              </Segment>
            </GridColumn>
            <GridColumn width={11}>
              <Message attached header="core details" />
              <Segment attached textAlign="center">
                {cable.cores?.map((core, index) => (
                  <p
                    key={index}
                    onClick={() => highlightConnectedCore(core)}
                    style={
                      highlight.includes(core.id)
                        ? { backgroundColor: "#1EA1A1" }
                        : null
                    }
                  >
                    <span
                      key={core.id}
                      style={
                        (connection.left &&
                          connection.left.coreId === core.id) ||
                        (connection.right &&
                          connection.right.coreId === core.id)
                          ? { display: "block", backgroundColor: "#90EE90" }
                          : {}
                      }
                    >
                      <b>
                        CORE : {banglaColorMap[core.color] || core.color || "—"}
                      </b>{" "}
                      &nbsp; &nbsp;
                      {core.connected_to !== null ? (
                        <>
                          <Button basic compact color="green">
                            Connected
                          </Button>
                          <Button
                            compact
                            color="red"
                            onClick={() => {
                              onRemove(core.id, core.connected_to.id);
                            }}
                          >
                            Remove
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button basic compact>
                            Unused
                          </Button>
                          <Button
                            compact
                            color="blue"
                            disabled={disableButtonList.includes(core.id)}
                            onClick={() => {
                              onSelect({
                                cableId: cable.id,
                                cableIdentifier: cable.identifier,
                                coreId: core.id,
                                color: core.color,
                              });
                            }}
                          >
                            Select
                          </Button>
                        </>
                      )}
                      {core.last_point ? (
                        <>
                          &nbsp; &nbsp; Connected with -
                          <b>
                            {core.last_point.type} - (
                            {core.last_point.identifier})
                          </b>
                        </>
                      ) : null}
                    </span>
                  </p>
                ))}
              </Segment>
            </GridColumn>
          </GridRow>
        ))}
      </Grid>
      {splitterDetails &&
        splitterDetails.length > 0 &&
        splitterDetails.map((splitter, index) => (
          <div key={index}>
            <Message
              header={`${splitter.splitter_type} Splitter`}
              color="teal"
              style={{ textAlign: "center", marginTop: "1rem" }}
            />
            <Grid columns={2}>
              <GridRow>
                <GridColumn width={5}>
                  <Message
                    attached
                    header={`${splitter.splitter_type} Configuration`}
                  />
                  <Segment attached>
                    <p>
                      <b> {`Type : 1X${splitter.number_of_splitter}`}</b>
                    </p>
                  </Segment>
                </GridColumn>
                <GridColumn width={11}>
                  <Message attached header="core details" />
                  <Segment attached textAlign="center">
                    {splitter.output_cores?.map((core, index) => (
                      <p
                        key={index}
                        onClick={() => highlightConnectedCore(core)}
                        style={
                          highlight.includes(core.id)
                            ? { backgroundColor: "#1EA1A1" }
                            : null
                        }
                      >
                        <span
                          key={core.id}
                          style={
                            (connection.left &&
                              connection.left.coreId === core.id) ||
                            (connection.right &&
                              connection.right.coreId === core.id)
                              ? { display: "block", backgroundColor: "#90EE90" }
                              : {}
                          }
                        >
                          {index === 0 ? (
                            <span
                              style={{
                                display: "inline",
                                marginRight: "1rem",
                                backgroundColor: "#1EA1A1",
                                padding: ".4rem 1.5rem",
                                fontWeight: "bold",
                              }}
                            >
                              Input core :
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline",
                                marginRight: "1rem",
                                fontWeight: "bold",
                              }}
                            >
                              Output : {core.core_number}
                            </span>
                          )}

                          {core.connected_to !== null ? (
                            <>
                              <Button basic compact color="grey">
                                Connected
                              </Button>
                              <Button
                                compact
                                color="red"
                                onClick={() => {
                                  onRemove(core.id, core.connected_to.id);
                                }}
                              >
                                Remove
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button basic compact color="grey">
                                Unused
                              </Button>
                              <Button
                                compact
                                color="blue"
                                disabled={disableButtonList.includes(core.id)}
                                onClick={() => {
                                  onSelect(
                                    {
                                      cableId: null,
                                      cableIdentifier: null,
                                      coreId: core.id,
                                      coreNumber: core.core_number,
                                      color: null,
                                    },
                                    splitter.output_cores
                                  );
                                }}
                              >
                                Select
                              </Button>
                            </>
                          )}
                        </span>
                      </p>
                    ))}
                  </Segment>
                </GridColumn>
              </GridRow>
            </Grid>
          </div>
        ))}

      {cableDetails?.length === 0 && splitterDetails?.length === 0 && (
        <Segment textAlign="center" secondary>
          No cble or splitter Found
        </Segment>
      )}
    </>
  );
};

export default TJBoxConnectionTab;
