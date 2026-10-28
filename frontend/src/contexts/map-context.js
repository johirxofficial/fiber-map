import { createContext, useMemo, useState, useContext } from "react";

const defaultValues = {
  map: null,
  setMap: () => {},
};

const MapContext = createContext(defaultValues);

export const MapContextProvider = (props) => {
  const [map, setMap] = useState(defaultValues.map);

  const contextValue = useMemo(
    () => ({
      map,
      setMap,
    }),
    [map]
  );

  return (
    <MapContext.Provider value={contextValue}>
      {props.children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error("useMapContext must be used within a MapContextProvider");
  }
  return context;
};
