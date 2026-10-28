import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { mapActions } from "../../store/map/reducer";

import { FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import LocationMarker from "./LocationMarker";

const drawOptions = {
  rectangle: false,
  circle: false,
  circlemarker: false,
  polygon: false,
  marker: false,
};
const Draw = () => {
  const dispatch = useDispatch();
  const drawLine = useSelector((state) => state.map.drawLine);
  const featureGroupRef = useRef(null);

  const [drawing, setDrawing] = useState(false);

  // Once the cable form closes (created or cancelled), remove the temporary
  // line so the next cable starts with a clean map.
  useEffect(() => {
    if (drawLine === null && featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
  }, [drawLine]);

  const handleCreated = (e) => {
    const parsed = e.layer._latlngs.map((latlng) => {
      return {
        lat: latlng.lat,
        lng: latlng.lng,
      };
    });
    dispatch(mapActions.setDrawLine(parsed));
  };

  return (
    <>
      <FeatureGroup ref={featureGroupRef}>
        <EditControl
          position="topright"
          onCreated={handleCreated}
          draw={drawOptions}
          onDrawStart={() => {
            setDrawing(true);
            dispatch(mapActions.updateLatLang(null));
          }}
          onDrawStop={() => setDrawing(false)}
          edit={{ edit: false }}
        />
      </FeatureGroup>
      {!drawing && <LocationMarker />}
    </>
  );
};

export default Draw;
