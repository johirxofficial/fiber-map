import { useEffect, useState } from "react";
import {
  Grid,
  Loader,
  Header,
  Form,
  Button,
  Image,
  Checkbox,
} from "semantic-ui-react";
import isEmptyStirng from "../utility/isEmptyStirng";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { authLogin } from "../store/auth/actions";
import { Navigate } from "react-router-dom";
import { getSiteInfo } from "../services";

const FALLBACK_LOGO = "/static/img/logo.jpg";

const Login = () => {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.auth.loading);
  const token = useSelector((state) => state.auth.token);
  const [site, setSite] = useState({
    site_name: "fiber-map",
    tagline: "Fiber network management map",
    logo_url: "",
  });

  useEffect(() => {
    let mounted = true;
    getSiteInfo().then(({ data }) => {
      if (mounted && data) {
        setSite({
          site_name: data.site_name || "fiber-map",
          tagline: data.tagline || "",
          logo_url: data.logo_url || "",
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (token !== null) {
    return <Navigate to="/" />;
  }

  const handleSubmit = (event) => {
    event.preventDefault();

    const username = event.target.username.value;
    const password = event.target.password.value;

    if (isEmptyStirng(username)) {
      toast.error("Username is required !");
    } else if (isEmptyStirng(password)) {
      toast.error("Password is required !");
    } else {
      dispatch(authLogin(username, password));
    }
  };

  return (
    <Grid
      centered
      stackable
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
        paddingTop: "40px",
      }}
    >
      <Grid.Column
        mobile={12}
        tablet={10}
        computer={8}
        style={{ maxWidth: "450px" }}
      >
        <div>
          <Image
            centered
            src={site.logo_url || FALLBACK_LOGO}
            alt="logo"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_LOGO;
            }}
            style={{ height: "150px", width: "200px", objectFit: "contain" }}
          />

          <Header
            style={{
              marginTop: "0px",
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            <Header.Subheader>{site.tagline}</Header.Subheader>
          </Header>
        </div>
        <Header
          style={{
            marginTop: "15px",
            paddingBottom: "13px",
            marginBottom: "25px",
            textAlign: "center",
          }}
          textAlign="left"
          as="h1"
          dividing
        >
          {site.site_name}
          <Header.Subheader>{site.tagline}</Header.Subheader>
        </Header>
        <Form onSubmit={handleSubmit}>
          <Form.Field>
            <label style={{ color: "grey" }}>Username</label>
            <input type="text" name="username" placeholder="username" />
          </Form.Field>
          <Form.Field>
            <label style={{ color: "grey" }}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="At least 6 characters"
            />
          </Form.Field>
          <Form.Field>
            <Checkbox
              label={
                <label style={{ color: "grey", fontWeight: "bold" }}>
                  Remember me
                </label>
              }
            />
          </Form.Field>
          <Button secondary className="fluid" type="submit">
            {loading ? <Loader active inline size="tiny" /> : "Login"}
          </Button>
        </Form>
      </Grid.Column>
    </Grid>
  );
};

export default Login;
