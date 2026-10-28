import {
  getClients,
  getTJBoxs,
  getGpons,
  getPops,
  getCables,
  getResellers,
  getZones,
  getSubZones,
  getNetworkCategories,
  getCustomPoints,
} from "../../services";
import { mapActions } from "./reducer";

export const updatePops = () => {
  return async (dispatch) => {
    try {
      const { data, status } = await getPops();
      dispatch(mapActions.setPops(status === 200 ? data || [] : []));
    } catch (error) {
      console.error(error);
      dispatch(mapActions.setPops([]));
    }
  };
};
export const updateClients = () => {
  return async (dispatch) => {
    try {
      const { data, status } = await getClients();
      dispatch(mapActions.setClients(status === 200 ? data || [] : []));
    } catch (error) {
      console.error(error);
      dispatch(mapActions.setClients([]));
    }
  };
};
export const updateResellers = () => {
  return async (dispatch) => {
    try {
      const { data, status } = await getResellers();
      dispatch(mapActions.setResellers(status === 200 ? data || [] : []));
    } catch (error) {
      console.error(error);
      dispatch(mapActions.setResellers([]));
    }
  };
};

export const updateTJBoxs = () => {
  return async (dispatch) => {
    try {
      const { data, status } = await getTJBoxs();
      dispatch(mapActions.setTJBoxs(status === 200 ? data || [] : []));
    } catch (error) {
      console.error(error);
      dispatch(mapActions.setTJBoxs([]));
    }
  };
};

export const updateGpons = () => {
  return async (dispatch) => {
    try {
      const { data, status } = await getGpons();
      dispatch(mapActions.setGpons(status === 200 ? data || [] : []));
    } catch (error) {
      console.error(error);
      dispatch(mapActions.setGpons([]));
    }
  };
};
/* Branch is the Zone model and Zone is the SubZone model in the UI. */
export const updateBranches = () => {
  return async (dispatch) => {
    try {
      const { data, status } = await getZones();
      dispatch(mapActions.setBranches(status === 200 ? data || [] : []));
    } catch (error) {
      console.error(error);
      dispatch(mapActions.setBranches([]));
    }
  };
};

export const updateZones = () => {
  return async (dispatch) => {
    try {
      const { data, status } = await getSubZones();
      dispatch(mapActions.setZones(status === 200 ? data || [] : []));
    } catch (error) {
      console.error(error);
      dispatch(mapActions.setZones([]));
    }
  };
};

export const updateCategories = () => {
  return async (dispatch) => {
    try {
      const { data, status } = await getNetworkCategories();
      dispatch(mapActions.setCategories(status === 200 ? data || [] : []));
    } catch (error) {
      console.error(error);
      dispatch(mapActions.setCategories([]));
    }
  };
};

export const updateCustomPoints = () => {
  return async (dispatch) => {
    try {
      const { data, status } = await getCustomPoints();
      dispatch(mapActions.setCustomPoints(status === 200 ? data || [] : []));
    } catch (error) {
      console.error(error);
      dispatch(mapActions.setCustomPoints([]));
    }
  };
};

export const updateCables = () => {
  return async (dispatch) => {
    try {
      const { data, status } = await getCables();
      dispatch(mapActions.setCables(status === 200 ? data || [] : []));
    } catch (error) {
      console.error(error);
      dispatch(mapActions.setCables([]));
    }
  };
};
