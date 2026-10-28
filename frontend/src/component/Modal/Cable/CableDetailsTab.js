import { Grid, GridRow, GridColumn } from "semantic-ui-react";
import { getCableDetails } from "../../../services";
import { useEffect, useState } from "react";
import handleError from "../../../utility/handleError";

const CableDetailsTab = ({ cableId }) => {
  const [cableDetails, setCableDetails] = useState({});

  const getCable = async () => {
    const response = await getCableDetails(cableId);
    if (response.status === 200) {
      setCableDetails(response.data);
    }
    if (response.error) {
      handleError(response.error);
    }
  };

  useEffect(() => {
    getCable();
  }, []);
  return (
    <Grid stackable style={{ marginLeft: "10%" }}>
      <GridRow>
        <GridColumn width={8}>
          <span
            style={{
              fontWeight: "bold",
              marginRight: "5px",
              fontSize: "1.1rem",
            }}
          >
            ID :
          </span>
          {cableDetails.identifier}
        </GridColumn>
        <GridColumn width={8}>
          <span
            style={{
              fontWeight: "bold",
              marginRight: "5px",
              fontSize: "1.1rem",
            }}
          >
            Type :
          </span>
          {cableDetails.type}
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn width={8}>
          <span
            style={{
              fontWeight: "bold",
              marginRight: "5px",
              fontSize: "1.1rem",
            }}
          >
            Start from :
          </span>
          {cableDetails.start_from}
        </GridColumn>
        <GridColumn width={8}>
          <span
            style={{
              fontWeight: "bold",
              marginRight: "5px",
              fontSize: "1.1rem",
            }}
          >
            Starting point :
          </span>
          {cableDetails.starting_point}
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn width={8}>
          <span
            style={{
              fontWeight: "bold",
              marginRight: "5px",
              fontSize: "1.1rem",
            }}
          >
            End_to :
          </span>
          {cableDetails.end_to}
        </GridColumn>
        <GridColumn width={8}>
          <span
            style={{
              fontWeight: "bold",
              marginRight: "5px",
              fontSize: "1.1rem",
            }}
          >
            Ending point :
          </span>
          {cableDetails.ending_point}
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn width={8}>
          <span
            style={{
              fontWeight: "bold",
              marginRight: "5px",
              fontSize: "1.1rem",
            }}
          >
            Number of cores :
          </span>
          {cableDetails.number_of_cores}
        </GridColumn>
        <GridColumn width={8}>
          <span
            style={{
              fontWeight: "bold",
              marginRight: "5px",
              fontSize: "1.1rem",
            }}
          >
            Length :
          </span>
          {cableDetails.length}
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn width={8}>
          <span
            style={{
              fontWeight: "bold",
              marginRight: "5px",
              fontSize: "1.1rem",
            }}
          >
            Notes:
          </span>
          <span style={{ overflowWrap: "break-word" }}>
            {cableDetails.notes}
          </span>
        </GridColumn>
        <GridColumn width={8}>
          <span
            style={{
              fontWeight: "bold",
              marginRight: "5px",
              fontSize: "1.1rem",
            }}
          >
            Description:
          </span>
          <span style={{ overflowWrap: "break-word" }}>
            {cableDetails.description}
          </span>
        </GridColumn>
      </GridRow>
    </Grid>
  );
};
export default CableDetailsTab;
