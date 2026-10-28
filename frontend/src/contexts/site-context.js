import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSiteInfo } from "../services";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAX_GPS_DISTANCE_KM,
} from "../config/mapConfig";

const SiteConfigContext = createContext(null);

function numberOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export const SiteConfigProvider = ({ children }) => {
  const [site, setSite] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const refreshSite = useCallback(async () => {
    const response = await getSiteInfo();
    if (response.data) {
      setSite(response.data);
    }
    setLoaded(true);
    return response.data;
  }, []);

  useEffect(() => {
    let mounted = true;
    getSiteInfo().then(({ data }) => {
      if (mounted) {
        if (data) setSite(data);
        setLoaded(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const mapConfig = useMemo(() => {
    const lat = numberOr(site?.map_center_lat, DEFAULT_MAP_CENTER.lat);
    const lng = numberOr(site?.map_center_lng, DEFAULT_MAP_CENTER.lng);
    const zoom = numberOr(site?.map_zoom, DEFAULT_MAP_ZOOM);
    const maxDistanceKm = numberOr(
      site?.gps_max_distance_km,
      MAX_GPS_DISTANCE_KM
    );
    return {
      center: { lat, lng },
      zoom: Math.min(22, Math.max(1, zoom)),
      maxDistanceKm: maxDistanceKm >= 0 ? maxDistanceKm : MAX_GPS_DISTANCE_KM,
    };
  }, [site]);

  const value = useMemo(
    () => ({ site, loaded, mapConfig, refreshSite }),
    [site, loaded, mapConfig, refreshSite]
  );

  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error("useSiteConfig must be used within a SiteConfigProvider");
  }
  return context;
};
