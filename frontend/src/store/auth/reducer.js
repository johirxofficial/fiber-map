import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    loading: false,
    token: localStorage.getItem("token") || null,
  },
  reducers: {
    authStarts(state) {
      state.loading = true;
    },
    authSuccess(state, action) {
      state.loading = false;
      state.token = action.payload;
    },
    authLogout(state) {
      state.token = null;
      state.loading = false;
      localStorage.removeItem("token");
      localStorage.removeItem("expirationDate");
    },
  },
});

export const authActions = authSlice.actions;
export default authSlice;
