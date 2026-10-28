import { Marker } from "react-leaflet";
import { useSelector } from "react-redux";
import { RedMarkerIcon } from "./MarkerIcons";
const ModelFinderMarker = () => {
  const latlang = useSelector((state) => state.map.modelLatlang);

  return latlang === null ? null : (
    <Marker icon={RedMarkerIcon} position={latlang}></Marker>
  );
};

export default ModelFinderMarker;
