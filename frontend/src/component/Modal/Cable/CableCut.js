import {
  Grid,
  GridRow,
  GridColumn,
  Message,
  Form,
  Button,
} from "semantic-ui-react";
import { useState } from "react";
import {
  LayersControl,
  MapContainer,
  Polyline,
  TileLayer,
  Marker,
} from "react-leaflet";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import isEmptyStirng from "../../../utility/isEmptyStirng";
import { cableCut } from "../../../services";
import { updateCables, updateTJBoxs } from "../../../store/map/actions";
import handleError from "../../../utility/handleError";
import { RedMarkerIcon } from "../../Map/MarkerIcons";
import GeoUtil from "leaflet-geometryutil";

const coreColorMap = {
  2: "#0000FF", //blue
  4: "#FF0000", //red
  6: "#000000", //black
  8: "#800080", //purple
  12: "#FFA500", //orange
  24: "#FFFF00", //yellow
  48: "#008000", //yellow
};

const CableCut = ({ cableId, polyline, numberOfCores, modalClose }) => {
  const { BaseLayer } = LayersControl;
  const [latlang, setLatlang] = useState(null);
  const dispatch = useDispatch();

  const [closest, setClosest] = useState([]);
  const safePolyline = Array.isArray(polyline) ? polyline : [];
  const mapCenter =
    safePolyline.length > 0
      ? safePolyline[Math.floor(safePolyline.length / 2)]
      : { lat: 22.8724, lng: 91.0973 };

  const [id, setId] = useState("");
  const [name, setName] = useState("");

  const getSegment = (latlng, line) => {
    // get layerpoint of user click
    const latlngs = line._latlngs;
    let segments = [];
    // get segments of polyline
    for (let i = 0; i < latlngs.length - 1; i++) {
      const pointToLineDistance = GeoUtil.distanceSegment(
        line._map,
        latlng,
        latlngs[i],
        latlngs[i + 1]
      );

      segments.push({
        index: i,
        pointToLineDistance,
        segment: [latlngs[i], latlngs[i + 1]],
      });
    }

    // sort segments by shortest distance
    segments.sort((a, b) =>
      a.pointToLineDistance < b.pointToLineDistance ? -1 : 1
    );

    // return first entry, which has shortest distance
    const shortestSegment = segments[0];
    return shortestSegment;
  };

  const onPolylineClick = (event) => {
    const closest = getSegment(event.latlng, event.sourceTarget);
    setLatlang({
      lat: event.latlng.lat,
      lng: event.latlng.lng,
    });
    setClosest([closest]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEmptyStirng(id)) {
      toast.error("Please enter Identifier");
      return;
    }

    if (isEmptyStirng(name)) {
      toast.error("Please enter cable name");
      return;
    }

    if (latlang === null || !closest[0]) {
      toast.error("Click on cable to select the cut location");
      return;
    }
    const payload = {
      push_index: closest[0].index,
      divider_point: [latlang.lat, latlang.lng],
      tjbox_id: id,
      tjbox_name: name,
    };
    const reponse = await cableCut(cableId, payload);
    if (reponse.status === 200) {
      handleReset();
      dispatch(updateCables());
      dispatch(updateTJBoxs());
      modalClose();
      toast.success("Cable cut successfully");
    }
    if (reponse.error) {
      handleError(reponse.error);
    }
  };

  const handleReset = () => {
    setId("");
    setName("");
  };

  return (
    <Grid stackable>
      <GridRow>
        <GridColumn width={10}>
          <MapContainer
            center={mapCenter}
            zoom={18}
            zoomControl={false}
            style={{ height: "400px", width: "100%" }}
          >
            <LayersControl position="topright">
              <BaseLayer checked name="Google Hybrid">
                <TileLayer
                  url="https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
                  subdomains={["mt0", "mt1", "mt2", "mt3"]}
                  maxZoom={22}
                  attribution="&copy; Google Satellite"
                />
              </BaseLayer>
              <BaseLayer name="Google Streets">
                <TileLayer
                  attribution="&copy; Google Maps"
                  url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                  subdomains={["mt0", "mt1", "mt2", "mt3"]}
                  maxZoom={22}
                />
              </BaseLayer>
            </LayersControl>

            <Polyline
              pathOptions={{
                color: coreColorMap[numberOfCores],
                weight: 5,
              }}
              positions={safePolyline}
              eventHandlers={{
                click: (event) => onPolylineClick(event),
              }}
            ></Polyline>
            {latlang && (
              <Marker icon={RedMarkerIcon} position={latlang}></Marker>
            )}
          </MapContainer>
        </GridColumn>
        <GridColumn width={6}>
          <Message info>Please click on the cable to get coordinate </Message>
          <Form onSubmit={handleSubmit} onReset={handleReset} noValidate>
            <Form.Field required>
              <label>ID</label>
              <input
                placeholder="Must be unique"
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
            </Form.Field>
            <Form.Field required>
              <label>Name</label>
              <input
                placeholder="TJ Box name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Field>
            <Form.Field required>
              <label>Latitude</label>
              <input value={latlang ? latlang.lat : ""} disabled />
            </Form.Field>
            <Form.Field required>
              <label>Longitude</label>
              <input value={latlang ? latlang.lng : ""} disabled />
            </Form.Field>

            <Button secondary type="submit">
              Submit
            </Button>
            <Button color="red" type="reset">
              Clear
            </Button>
          </Form>
        </GridColumn>
      </GridRow>
    </Grid>
  );
};
export default CableCut;
