import React, { useEffect, useState } from "react";
import {
  getClientCoreDetails,
  updateCoreAssignStatus,
} from "../../../services";
import {
  Grid,
  GridRow,
  GridColumn,
  Segment,
  Message,
  Button,
} from "semantic-ui-react";

import banglaColorMap from "../../../utility/banglaColorMap";

const ClientConnectionTab = ({ clientId }) => {
  const [cableDetails, setCableDetails] = useState(null);
  useEffect(() => {
    getCoreDetails(clientId);
  }, []);

  const getCoreDetails = async (id) => {
    try {
      const { data, status } = await getClientCoreDetails(id);
      if (status === 200) {
        setCableDetails(data);
      }
    } catch (error) {
      return { data: null, status: null, error };
    }
  };

  const handleAssign = async (id, payload) => {
    try {
      const { status } = await updateCoreAssignStatus(id, payload);

      if (status === 200) {
        getCoreDetails(clientId);
      }
    } catch (error) {
      return { data: null, status: null, error };
    }
  };

  return (
    <>
      {cableDetails && cableDetails.length > 0 ? (
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
                    <b>CABLE length : </b>
                    {cable.length}
                  </p>
                </Segment>
              </GridColumn>
              <GridColumn width={11}>
                <Message attached header="core details" />
                <Segment attached textAlign="center">
                  {cable.cores?.map((core) => (
                    <p key={core.id}>
                      <b>CORE : {banglaColorMap[core.color]}</b> &nbsp; &nbsp;
                      {core.assigned ? (
                        <>
                          <Button basic compact color="green">
                            Used
                          </Button>
                          <Button
                            compact
                            color="red"
                            onClick={() =>
                              handleAssign(core.id, { assigned: false })
                            }
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
                            onClick={() =>
                              handleAssign(core.id, { assigned: true })
                            }
                          >
                            Assign
                          </Button>
                        </>
                      )}
                    </p>
                  ))}
                </Segment>
              </GridColumn>
            </GridRow>
          ))}
        </Grid>
      ) : (
        <Segment textAlign="center" secondary attached basic>
          No Cables
        </Segment>
      )}
    </>
  );
};

export default ClientConnectionTab;
