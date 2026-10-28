import { useState, useEffect } from "react";
import PathConnection from "../PathConnection";
import { getClientConnectedPaths } from "../../../services";
import { Button, Segment } from "semantic-ui-react";
import { useDispatch } from "react-redux";
import { mapActions } from "../../../store/map/reducer";

const ClientDetailsTab = ({ clientId, modalClose }) => {
  const dispatch = useDispatch();
  const [connectionPaths, setConnectionPaths] = useState(null);

  useEffect(() => {
    getPaths(clientId);
  }, []);

  const getPaths = async (id) => {
    try {
      const { data, status } = await getClientConnectedPaths(id);
      if (status === 200) {
        setConnectionPaths(data);
      }
    } catch (error) {
      return { data: null, status: null, error };
    }
  };

  const handleHighlightPath = (paths) => {
    dispatch(mapActions.setHighlightPath(paths));
    modalClose();
  };
  return (
    <>
      {connectionPaths && connectionPaths.length > 0 ? (
        connectionPaths.map((path, index) => {
          return (
            <div
              style={{
                backgroundColor: "#F0F0F0",
                padding: "10px",
                textAlign: "center",
                marginBottom: "1rem",
              }}
              key={index}
            >
              <Button
                style={{ margin: "1rem" }}
                onClick={() => handleHighlightPath(path.path_direction)}
              >
                SHOW THIS PATH ON MAP
              </Button>
              <PathConnection key={index} path={path} />
            </div>
          );
        })
      ) : (
        <Segment textAlign="center" secondary attached basic>
          No path to show
        </Segment>
      )}
    </>
  );
};

export default ClientDetailsTab;
