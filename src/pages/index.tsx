import React from "react";
import {
  Container,
  makeStyles,
  Button,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  AppBar,
  Toolbar,
  Typography,
} from "@material-ui/core";
import firebase from "../plugins/firebase";
import { handleGoogleLogin, handleLogout } from "../lib/auth";
import { fetchRoomAll } from "../lib/database";
import { RoomDocument } from "../lib/model";
import CreateDialog from "../components/createDialog";
import EnterDialog from "../components/enterDialog";

interface AppProps {
  rooms: RoomDocument[];
}

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: "16px",
    marginBottom: "16px",
    marginLeft: "0px",
    marginRight: "0px",
    paddingLeft: "4px",
    paddingRight: "4px",
  },
  offset: theme.mixins.toolbar,
}));

const Index = (props: AppProps) => {
  const classes = useStyles();
  const [currentUser, setCurrentUser] = React.useState<firebase.User>();
  const [createModal, setCreateModal] = React.useState(false);
  const [enterModal, setEnterModal] = React.useState(false);
  const [selectRoom, setSelectRoom] = React.useState(null);

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      setCurrentUser(user);
    } else {
      setCurrentUser(null);
    }
  });

  const loginUser = () => {
    handleGoogleLogin();
  };

  const logoutUser = () => {
    handleLogout();
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" color="inherit" style={{ flexGrow: 1 }}>
            Online Lecture System
          </Typography>
          {!!currentUser ? (
            <>
              <Button
                color="inherit"
                onClick={() => setCreateModal(true)}
                style={{ marginRight: "8px" }}
              >
                Create Room
              </Button>
              <Button
                color="inherit"
                onClick={logoutUser}
                style={{ marginRight: "8px" }}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button color="inherit" onClick={loginUser}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" className={classes.container}>
        {!!currentUser ? (
          <div>
            <p style={{ textAlign: "center" }}>
              Now logged in as <b>{currentUser.displayName}</b>
            </p>
            <Grid container spacing={2}>
              {props.rooms.map((room: RoomDocument, index: number) => {
                return (
                  <Grid item xs={6} md={3} lg={3}>
                    <Card>
                      <CardActionArea>
                        <CardContent>
                          <h3>{room.name}</h3>
                          <Button
                            variant="contained"
                            onClick={() => {
                              setSelectRoom(room);
                              setEnterModal(true);
                            }}
                          >
                            Enter Room
                          </Button>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
            <CreateDialog
              currentUser={currentUser}
              isOpen={createModal}
              closeModal={() => setCreateModal(false)}
            ></CreateDialog>
            <EnterDialog
              selectRoom={selectRoom}
              currentUser={currentUser}
              isOpen={enterModal}
              closeModal={() => {
                setEnterModal(false);
                setSelectRoom(null);
              }}
            ></EnterDialog>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          ></div>
        )}
      </Container>
    </>
  );
};

Index.getInitialProps = async () => {
  const rooms: RoomDocument[] = await fetchRoomAll();
  return { rooms };
};

export default Index;
