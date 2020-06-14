import React from "react";
import {
  Container,
  makeStyles,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  CardActionArea,
} from "@material-ui/core";
import { useRouter } from "next/router";
import firebase from "../plugins/firebase";
import { handleGoogleLogin } from "../lib/auth";
import { updateIsListener, selectRoomDocuments } from "../lib/database";
import { RoomDocument } from "../lib/model";

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
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<firebase.User>();

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      setCurrentUser(user);
    } else {
      setCurrentUser(null);
    }
  });

  const createRoom = async () => {
    await updateIsListener(currentUser.uid, true);
    router.push("/room/test?type=speaker");
  };
  const enterRoom = async (roomId: string) => {
    await updateIsListener(currentUser.uid, false);
    router.push(`/room/${roomId}?type=listener`);
  };
  const loginUser = () => {
    handleGoogleLogin();
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
              onClick={createRoom}
              style={{ marginRight: "8px" }}
            >
              Create Room
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
                            enterRoom(room.uid);
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
  const roomDocuments = await selectRoomDocuments();

  const datas = await roomDocuments.get();
  const rooms: RoomDocument[] = [];
  datas.forEach((room) => {
    rooms.push(room.data() as RoomDocument);
  });
  return { rooms };
};

export default Index;
