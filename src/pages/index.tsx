import React from "react";
import {
  Container,
  makeStyles,
  Button,
  Grid,
  Card,
  CardContent,
  CardActionArea,
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

const useStyles = makeStyles({
  container: {
    marginTop: "16px",
    marginBottom: "16px",
    marginLeft: "0px",
    marginRight: "0px",
    paddingLeft: "4px",
    paddingRight: "4px",
  },
});

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
    <Container maxWidth="lg" className={classes.container}>
      {!!currentUser ? (
        <div>
          <p style={{ textAlign: "center" }}>
            Now logged in as <b>{currentUser.displayName}</b>
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "32px",
            }}
          >
            <Button
              variant="contained"
              onClick={() => setCreateModal(true)}
              style={{ marginRight: "8px" }}
            >
              Create Room
            </Button>
            <Button
              variant="contained"
              onClick={logoutUser}
              style={{ marginRight: "8px" }}
            >
              Logout
            </Button>
          </div>
          <Grid container>
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
        >
          <Button variant="contained" onClick={loginUser}>
            Login
          </Button>
        </div>
      )}
    </Container>
  );
};

Index.getInitialProps = async () => {
  const rooms: RoomDocument[] = await fetchRoomAll();
  return { rooms };
};

export default Index;
