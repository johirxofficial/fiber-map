import { login, verifyToken } from "../../services/auth";
import { authActions } from "./reducer";
import handleError from "../../utility/handleError";

export const authLogin = (username, password) => {
  return async (dispatch) => {
    dispatch(authActions.authStarts());
    const payload = {
      username: username,
      password: password,
    };
    const response = await login(payload);

    if (response.status === 200) {
      const token = response.data.token;
      dispatch(authActions.authSuccess(token));
      const expirationDate = new Date(new Date().getTime() + 3600 * 1000);
      localStorage.setItem("token", token);
      localStorage.setItem("expirationDate", expirationDate);
      dispatch(checkAuthTimeOut(3600));
    }

    if (response.error) {
      dispatch(authActions.authLogout());
      handleError(response.error);
    }
  };
};

export const checkAuthTimeOut = (expirationTime) => {
  return (dispatch) => {
    setTimeout(() => {
      dispatch(authActions.authLogout());
    }, expirationTime * 1000);
  };
};

export const authCheckState = () => {
  return async (dispatch) => {
    const token = localStorage.getItem("token");

    if (!token) {
      dispatch(authActions.authLogout());
    } else {
      const response = await verifyToken();
      if (response.status === 200) {
        dispatch(authActions.authSuccess(token));
      }
      if (response.error) {
        dispatch(authActions.authLogout());
        handleError(response.error);
      }
      // const expirationDate = new Date(localStorage.getItem("expirationDate"));

      // if (expirationDate <= new Date()) {
      //   dispatch(authActions.authLogout());
      // } else {
      //   const response = await verifyToken();
      //   if (response.status === 200) {
      //     dispatch(authActions.authSuccess(token));
      //   }
      //   if (response.error) {
      //     dispatch(authActions.authLogout());
      //     handleError(response.error);
      //   }

      //   dispatch(
      //     checkAuthTimeOut((expirationDate - new Date().getTime()) / 1000)
      //   );
      // }
    }
  };
};
