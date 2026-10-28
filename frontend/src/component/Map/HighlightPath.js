import { FeatureGroup, Polyline } from "react-leaflet";
import { useSelector, useDispatch } from "react-redux";
import { mapActions } from "../../store/map/reducer";
const HighlightPath = () => {
  const dispatch = useDispatch();
  const highlightPath = useSelector((state) => state.map.highlightPath);

  return (
    <>
      <FeatureGroup>
        {highlightPath && (
          <button
            onClick={(e) => {
              dispatch(mapActions.setHighlightPath(null));
            }}
            style={{
              position: "absolute",
              zIndex: 1000,
              marginLeft: "10px",
              marginTop: "120px",
              width: "34px",
              height: "31px",
              border: "2px solid rgba(0,0,0,0.2)",
              backgroundColor: "white",
              cursor: "pointer",
              display: "block",
            }}
          >
            <span
              style={{
                width: "100%",
                height: "100%",
                fontSize: "15px",
                fontWeight: "bold",
              }}
            >
              X
            </span>
          </button>
        )}
        {highlightPath?.map((cable, index) =>
          Array.isArray(cable?.cable_line) && cable.cable_line.length > 1 ? (
            <Polyline
              key={index}
              pathOptions={{ color: cable.color || "#2185d0", weight: 6 }}
              positions={cable.cable_line}
            ></Polyline>
          ) : null
        )}
      </FeatureGroup>
    </>
  );
};

export default HighlightPath;
