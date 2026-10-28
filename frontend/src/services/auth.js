import api from "../boot/axios";

export async function login(payload = {}) {
  try {
    const { data, status } = await api.post("login/", payload);

    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
export async function logout() {
  try {
    const { data, status } = await api.post("logout/");

    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function verifyToken() {
  try {
    const { data, status } = await api.get("verify-token/");

    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}

export async function signUp(payload = {}) {
  try {
    const { data, status } = await api.post("users/", payload);

    return { data, status, error: null };
  } catch (error) {
    return { data: null, status: null, error };
  }
}
