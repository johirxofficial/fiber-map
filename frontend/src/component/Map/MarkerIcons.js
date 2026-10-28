import { Icon } from "leaflet";
import peopleIcon from "../../assets/icons/client.png";
import popIcon from "../../assets/icons/office.png";
import tjBoxIcon from "../../assets/icons/junction.png";
import gponIcon from "../../assets/icons/gpon.png";
import resellerIcon from "../../assets/icons/reseller.png";
import locationIcon from "../../assets/icons/location.png";

export const PopIcon = new Icon({
  iconUrl: popIcon,
  iconSize: [28, 28],
});

export const ClientIcon = new Icon({
  iconUrl: peopleIcon,
  iconSize: [34, 55],
  popupAnchor: [0, -40],
  iconAnchor: [17.5, 52.5],
});

export const TJBoxIcon = new Icon({
  iconUrl: tjBoxIcon,
  iconSize: [28, 28],
});

export const GponIcon = new Icon({
  iconUrl: gponIcon,
  iconSize: [28, 28],
});

export const RedMarkerIcon = new Icon({
  iconUrl: locationIcon,
  iconSize: [30, 30],
  iconAnchor: [15, 28],
});

export const ResellerIcon = new Icon({
  iconUrl: resellerIcon,
  iconSize: [28, 28],
});
