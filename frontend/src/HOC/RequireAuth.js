import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const RequireAuth = ({ redirectPath = "/login", children }) => {
  const token = useSelector((state) => state.auth.token);
  if (token) {
    return children;
  } else {
    return <Navigate to={redirectPath} replace />;
  }
};

export default RequireAuth;
