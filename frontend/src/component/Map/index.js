import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  updatePops,
  updateClients,
  updateTJBoxs,
  updateGpons,
  updateCables,
  updateResellers,
  updateBranches,
  updateZones,
  updateCategories,
  updateCustomPoints,
} from "../../store/map/actions";
import AddCable from "../Cable/AddCable";
import Draw from "./Draw";

import Cables from "./Cables";
import Pops from "./Pops";
import TJBoxs from "./TJBoxs";
import Clients from "./Clients";
import HighlightPath from "./HighlightPath";

import { MapContainer, TileLayer, LayersControl, useMap } from "react-leaflet";

import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import "leaflet/dist/leaflet.css";
import "./map.css";
import "leaflet-draw/dist/leaflet.draw.css";
import CableColorInfo from "./CableColorInfo";
import { useMapContext } from "../../contexts/map-context";
import ModelFinderMarker from "./ModelFinderMarker";
import MapSearch from "./MapSearch";
import Resellers from "./Resellers";
import CustomPoints from "./CustomPoints";
import Gpons from "./Gpons";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  GOOGLE_HYBRID_URL,
  GOOGLE_STREET_URL,
  GOOGLE_TILE_SUBDOMAINS,
} from "../../config/mapConfig";
import { useSiteConfig } from "../../contexts/site-context";

const MapViewUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [map, center, zoom]);
  return null;
};
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const NetworkMap = () => {
  const { BaseLayer } = LayersControl;
  const { mapConfig } = useSiteConfig();
  const { setMap } = useMapContext();
  const dispatch = useDispatch();
  const drawLine = useSelector((state) => state.map.drawLine);

  useEffect(() => {
    dispatch(updatePops());
    dispatch(updateClients());
    dispatch(updateTJBoxs());
    dispatch(updateGpons());
    dispatch(updateCables());
    dispatch(updateResellers());
    dispatch(updateBranches());
    dispatch(updateZones());
    dispatch(updateCategories());
    dispatch(updateCustomPoints());
  }, [dispatch]);

  return (
    <>
      <AddCable visible={drawLine !== null} />

      <div className="map-shell">
        <MapContainer
          center={DEFAULT_MAP_CENTER}
          zoom={DEFAULT_MAP_ZOOM}
          minZoom={3}
          maxZoom={22}
          zoomControl
          scrollWheelZoom
          ref={setMap}
        >
          <MapViewUpdater center={mapConfig.center} zoom={mapConfig.zoom} />
          <LayersControl position="topright">
            <BaseLayer checked name="Google Satellite">
              <TileLayer
                url={GOOGLE_HYBRID_URL}
                subdomains={GOOGLE_TILE_SUBDOMAINS}
                maxZoom={22}
                attribution="&copy; Google Satellite"
              />
            </BaseLayer>
            <BaseLayer name="Google Streets">
              <TileLayer
                url={GOOGLE_STREET_URL}
                subdomains={GOOGLE_TILE_SUBDOMAINS}
                maxZoom={22}
                attribution="&copy; Google Maps"
              />
            </BaseLayer>
          </LayersControl>

          <CableColorInfo />
          <ModelFinderMarker />
          <Draw />
          <Pops />
          <Clients />
          <TJBoxs />
          <Resellers />
          <CustomPoints />
          <Gpons />
          <Cables />
          <HighlightPath />
        </MapContainer>
        <div className="map-search-overlay">
          <MapSearch />
        </div>
      </div>
    </>
  );
};

export default NetworkMap;
