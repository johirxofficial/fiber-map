import { configureStore } from "@reduxjs/toolkit";
import mapSlice from "./map/reducer";
import authSlice from "./auth/reducer";

const store = configureStore({
  reducer: { map: mapSlice.reducer, auth: authSlice.reducer },
});

export default store;
