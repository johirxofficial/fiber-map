import React from "react";
import PathConstants from "./pathConstants";
import { MapContextProvider } from "../contexts/map-context";
import Page404 from "../pages/Page404";

const Dashboard = React.lazy(() => import("../pages/Dashboad"));
const NetworkPoint = React.lazy(() => import("../pages/NetworkPoint"));

const routes = [
  { index: true, element: <Dashboard /> },
  {
    path: PathConstants.NETWORK_POINT,
    element: (
      <MapContextProvider>
        <NetworkPoint />
      </MapContextProvider>
    ),
  },
  { path: "*", element: <Page404 /> },
];

export default routes;
