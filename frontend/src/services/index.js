import api from "../boot/axios";

export async function fetchDashboardData() {
  try {
    const { data, status } = await api.get("dashboard/");

    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function createPop(params = {}) {
  try {
    const { data, status } = await api.post("/pop/create/", params);

    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function getPops(params = {}) {
  try {
    const { data, status } = await api.get("/pop/", {
      params,
    });
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function getPop(id) {
  try {
    const { data, status } = await api.get(`pop/${id}/update/`);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function updatePop(id, payload = {}) {
  try {
    const { data, status } = await api.put(`pop/${id}/update/`, payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function deletePop(id) {
  try {
    const { data, status } = await api.delete(`pop/${id}/delete/`);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function createClient(params = {}) {
  try {
    const { data, status } = await api.post("/client/create/", params);

    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function getClients(params = {}) {
  try {
    const { data, status } = await api.get("/client/", {
      params,
    });
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function getClient(id) {
  try {
    const { data, status } = await api.get(`client/${id}/update/`);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function updateClient(id, payload = {}) {
  try {
    const { data, status } = await api.put(`client/${id}/update/`, payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function deleteClient(id) {
  try {
    const { data, status } = await api.delete(`client/${id}/delete/`);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function getClientCoreDetails(id) {
  try {
    const { data, status } = await api.get(`client-details/${id}/cores/`, {});
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function getClientConnectedPaths(id = 0) {
  try {
    const { data, status } = await api.get(`client/${id}/paths/`, {});
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function createReseller(params = {}) {
  try {
    const { data, status } = await api.post("/reseller/create/", params);

    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function getResellers(params = {}) {
  try {
    const { data, status } = await api.get("/reseller/", {
      params,
    });
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function getReseller(id) {
  try {
    const { data, status } = await api.get(`reseller/${id}/update/`);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function updateReseller(id, payload = {}) {
  try {
    const { data, status } = await api.put(`reseller/${id}/update/`, payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function deleteReseller(id) {
  try {
    const { data, status } = await api.delete(`reseller/${id}/delete/`);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function getResellerCoreDetails(id) {
  try {
    const { data, status } = await api.get(`reseller-details/${id}/cores/`, {});
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function getResellerConnectedPaths(id = 0) {
  try {
    const { data, status } = await api.get(`reseller/${id}/paths/`, {});
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function createTJBox(params = {}) {
  try {
    const { data, status } = await api.post("/tjbox/create/", params);

    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function getTJBoxs(params = {}) {
  try {
    const { data, status } = await api.get("/tjbox/", {
      params,
    });
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function getTJBox(id) {
  try {
    const { data, status } = await api.get(`tjbox/${id}/update/`);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function updateTJBox(id, payload = {}) {
  try {
    const { data, status } = await api.put(`tjbox/${id}/update/`, payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function deleteTJBox(id) {
  try {
    const { data, status } = await api.delete(`tjbox/${id}/delete/`);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function createGpon(params = {}) {
  try {
    const { data, status } = await api.post("/gpon/create/", params);

    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function getGpons(params = {}) {
  try {
    const { data, status } = await api.get("/gpon/", {
      params,
    });
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function getGpon(id) {
  try {
    const { data, status } = await api.get(`gpon/${id}/update/`);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function updateGpon(id, payload = {}) {
  try {
    const { data, status } = await api.put(`gpon/${id}/update/`, payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function deleteGpon(id) {
  try {
    const { data, status } = await api.delete(`gpon/${id}/delete/`);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function createCable(params = {}) {
  try {
    const { data, status } = await api.post("/cable/create/", params);

    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function getCables(params = {}) {
  try {
    const { data, status } = await api.get("/cable/", {
      params,
    });
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function updateCoreAssignStatus(id = 0, payload = {}) {
  try {
    const { data, status } = await api.patch(
      `core/${id}/update-assign-status/`,
      payload
    );
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function getTJBoxCoreDetails(id) {
  try {
    const { data, status } = await api.get(`tjbox-details/${id}/cores/`, {});
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function getPopConnectedPaths(id = 0) {
  try {
    const { data, status } = await api.get(`pop/${id}/paths/`, {});
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function getPopCoreDetails(id) {
  try {
    const { data, status } = await api.get(`pop-details/${id}/cores/`, {});
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function getGponCoreDetails(id = 0) {
  try {
    const { data, status } = await api.get(`gpon-details/${id}/cores/`, {});
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function addGponInputCable(id = 0, payload = {}) {
  try {
    const { data, status } = await api.post(
      `gpon/${id}/add-input-cable/`,
      payload
    );
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function removeGponInputCable(id = 0) {
  try {
    const { data, status } = await api.post(`gpon/${id}/remove-input-cable/`);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function gponInputAssignCore(id = 0, payload = {}) {
  try {
    const { data, status } = await api.post(`gpon/${id}/assign-core/`, payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function gponInputWithdrawCore(id = 0, payload = {}) {
  try {
    const { data, status } = await api.post(
      `gpon/${id}/withdraw-core/`,
      payload
    );
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function connectCores(payload = {}) {
  try {
    const { data, status } = await api.post(`connect-cores/`, payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function disconnectCores(payload = {}) {
  try {
    const { data, status } = await api.post(`disconnect-cores/`, payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function getCableDetails(id) {
  try {
    const { data, status } = await api.get(`cable/${id}/update/`);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function updateCableDetails(id, payload = {}) {
  try {
    const { data, status } = await api.put(`cable/${id}/update/`, payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function deleteCable(id) {
  try {
    const { data, status } = await api.delete(`cable/${id}/delete/`);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function cableCut(id = 0, payload = {}) {
  try {
    const { data, status } = await api.post(`cable/${id}/cut/`, payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

/* -------------------------------------------------------------------------
 * Zones and sub-zones
 * ---------------------------------------------------------------------- */
export async function getZones(params = {}) {
  try {
    const { data, status } = await api.get("/zone/", { params });
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function createZone(payload = {}) {
  try {
    const { data, status } = await api.post("/zone/create/", payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function updateZone(id, payload = {}) {
  try {
    const { data, status } = await api.put(`/zone/${id}/update/`, payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function deleteZone(id) {
  try {
    const { data, status } = await api.delete(`/zone/${id}/delete/`);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function getSubZones(params = {}) {
  try {
    const { data, status } = await api.get("/subzone/", { params });
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function createSubZone(payload = {}) {
  try {
    const { data, status } = await api.post("/subzone/create/", payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function updateSubZone(id, payload = {}) {
  try {
    const { data, status } = await api.put(`/subzone/${id}/update/`, payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function deleteSubZone(id) {
  try {
    const { data, status } = await api.delete(`/subzone/${id}/delete/`);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

/* Public branding information (name, tagline and uploaded logo). */
export async function getSiteInfo() {
  try {
    const { data, status } = await api.get("/site/");
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

/* Network Point categories and records for newly-created service categories. */
export async function getNetworkCategories(params = {}) {
  try {
    const { data, status } = await api.get("/network-category/", { params });
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function createNetworkCategory(payload = {}) {
  try {
    const { data, status } = await api.post("/network-category/create/", payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function updateNetworkCategory(id, payload = {}) {
  try {
    const { data, status } = await api.put(`/network-category/${id}/update/`, payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function deleteNetworkCategory(id) {
  try {
    const { data, status } = await api.delete(`/network-category/${id}/delete/`);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function getCustomPoints(params = {}) {
  try {
    const { data, status } = await api.get("/custom-point/", { params });
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function createCustomPoint(payload = {}) {
  try {
    const { data, status } = await api.post("/custom-point/create/", payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function updateCustomPoint(id, payload = {}) {
  try {
    const { data, status } = await api.put(`/custom-point/${id}/update/`, payload);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function deleteCustomPoint(id) {
  try {
    const { data, status } = await api.delete(`/custom-point/${id}/delete/`);
    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
