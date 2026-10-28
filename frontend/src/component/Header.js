import React, { useEffect, useState } from "react";
import { Menu } from "semantic-ui-react";
import PathConstants from "../routes/pathConstants";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { authActions } from "../store/auth/reducer";
import { logout } from "../services/auth";
import { getSiteInfo } from "../services";

const FALLBACK_LOGO = "/static/img/logo.jpg";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [site, setSite] = useState({
    site_name: "fiber-map",
    logo_url: "",
  });
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    getSiteInfo().then(({ data }) => {
      if (mounted && data) {
        setSite({
          site_name: data.site_name || "fiber-map",
          logo_url: data.logo_url || "",
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const path = (location.pathname || "/").replace(/\/+$/, "") || "/";
  const isActive = (name) => {
    if (name === "dashboard") return path === "/" || path === "/dashboard";
    if (name === "network") return path === PathConstants.NETWORK_POINT;
    if (name === "management") return path.startsWith("/management") || path.startsWith("/manage") || path.startsWith("/site-settings");
    return false;
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      dispatch(authActions.authLogout());
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <Menu pointing secondary className="site-menu">
      <Menu.Item as={Link} to="/" className="brand-item">
        <img
          src={site.logo_url || FALLBACK_LOGO}
          alt="logo"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_LOGO;
          }}
        />
        <span>{site.site_name}</span>
      </Menu.Item>
      <Menu.Item
        name="dashboard"
        active={isActive("dashboard")}
        to={PathConstants.DASHBOARD}
        as={Link}
      >
        Dashboard
      </Menu.Item>
      <Menu.Item
        name="network-point"
        active={isActive("network")}
        to={PathConstants.NETWORK_POINT}
        as={Link}
      >
        Network Point
      </Menu.Item>
      <Menu.Item
        name="management"
        active={isActive("management")}
        href="/management/"
      >
        Management
      </Menu.Item>
      <Menu.Menu position="right">
        <Menu.Item
          name="logout"
          className="logout-item"
          disabled={loggingOut}
          onClick={handleLogout}
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </Menu.Item>
      </Menu.Menu>
    </Menu>
  );
};

export default Header;
