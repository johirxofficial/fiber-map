import { Marker, useMapEvents } from "react-leaflet";
import { useDispatch, useSelector } from "react-redux";
import { mapActions } from "../../store/map/reducer";
function LocationMarker() {
  const latlang = useSelector((state) => state.map.latlang);
  const dispatch = useDispatch();

  useMapEvents({
    click(e) {
      dispatch(
        mapActions.updateLatLang({ lat: e.latlng.lat, lng: e.latlng.lng })
      );
    },
  });
  return latlang === null ? null : <Marker position={latlang}></Marker>;
}

export default LocationMarker;
