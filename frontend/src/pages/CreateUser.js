import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Grid,
  Header,
  Form,
  Loader,
  Message,
  Segment,
} from "semantic-ui-react";
import isEmptyStirng from "../utility/isEmptyStirng";
import { toast } from "react-toastify";
import { signUp, verifyToken } from "../services/auth";
import handleError from "../utility/handleError";
import PathConstants from "../routes/pathConstants";

const CreateUser = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;
    verifyToken().then((response) => {
      if (!mounted) return;
      setCanManage(Boolean(response.data?.user?.permissions?.manage));
      setChecking(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccess("");

    const form = event.target;
    const username = form.username.value;
    const password = form.password.value;
    const c_password = form.c_password.value;

    if (isEmptyStirng(username)) {
      toast.error("Username is required !");
      return;
    } else if (isEmptyStirng(password)) {
      toast.error("Password is required !");
      return;
    } else if (isEmptyStirng(c_password)) {
      toast.error("Enter Confirm Password !");
      return;
    } else if (password !== c_password) {
      toast.error("Password and confirmation do not match.");
      return;
    }

    const payload = {
      username: username,
      password: password,
      confirm_password: c_password,
    };
    setLoading(true);
    const response = await signUp(payload);
    setLoading(false);
    if (response.status === 201) {
      form.reset();
      setSuccess(`User "${username}" was created successfully.`);
      toast.success("User Created Successfully");
    }
    if (response.error) {
      handleError(response.error);
    }
  };

  if (checking) {
    return (
      <Segment padded="very" textAlign="center">
        <Loader active inline="centered">
          Checking permissions...
        </Loader>
      </Segment>
    );
  }

  if (!canManage) {
    return (
      <Grid centered>
        <Grid.Column mobile={12} tablet={10} computer={8}>
          <Segment style={{ marginTop: "30px" }}>
            <Header as="h2">Create User</Header>
            <Message warning>
              <Message.Header>Permission required</Message.Header>
              <p>
                Only administrators and managers can create users. Ask an
                administrator to grant the "Manage users" permission for your
                account.
              </p>
            </Message>
            <Button as={Link} to={PathConstants.DASHBOARD} primary>
              Go to Dashboard
            </Button>
            <Button as={Link} to={PathConstants.ZONES}>
              Open Zones
            </Button>
          </Segment>
        </Grid.Column>
      </Grid>
    );
  }

  return (
    <Grid centered>
      <Grid.Column mobile={12} tablet={10} computer={8}>
        <Header
          style={{
            marginTop: "15px",
            paddingBottom: "13px",
            marginBottom: "25px",
            textAlign: "center",
          }}
          textAlign="center"
          as="h2"
          dividing
        >
          Create User
          <Header.Subheader>
            Add a new account to this installation.
          </Header.Subheader>
        </Header>
        {success && (
          <Message positive>
            <Message.Header>User created</Message.Header>
            <p>{success}</p>
          </Message>
        )}
        <Form onSubmit={handleSubmit}>
          <Form.Field>
            <label>Username</label>
            <input type="text" name="username" placeholder="username" />
          </Form.Field>
          <Form.Field>
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="At least 6 characters"
            />
          </Form.Field>
          <Form.Field>
            <label>Confirm password</label>
            <input
              type="password"
              name="c_password"
              placeholder="Enter password again"
            />
          </Form.Field>
          <Button secondary className="fluid" type="submit" loading={loading}>
            Create User
          </Button>
        </Form>
        <Message info style={{ marginTop: "18px" }}>
          New user permissions are managed in the{" "}
          <a href="/management/?tab=users">Management users tab</a>. You can
          also use the menu above to open the <Link to={PathConstants.ZONES}>Zones</Link> page.
        </Message>
      </Grid.Column>
    </Grid>
  );
};

export default CreateUser;
