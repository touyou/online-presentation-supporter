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
  Dialog,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@material-ui/core";
import { Close, Title } from "@material-ui/icons";
import { useRouter } from "next/router";
import firebase from "../plugins/firebase";
import { handleGoogleLogin } from "../lib/auth";
import {
  updateIsListener,
  selectRoomDocuments,
  createRoomDocument,
} from "../lib/database";
import { RoomDocument } from "../lib/model";
import { useForm } from "react-hook-form";
import * as yup from "yup";

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
  modalHeader: {
    borderBottom: "none",
    padding: "24px 24px 0 24px",
    minHeight: "16.43px",
  },
  modalTitle: {
    margin: "0",
    lineHeight: "1.42857143",
  },
  modalCloseButton: {
    color: "#999999",
    marginTop: "-12px",
    WebkitAppearance: "none",
    padding: "0",
    cursor: "pointer",
    background: "0 0",
    border: "0",
    fontSize: "inherit",
    opacity: ".9",
    textShadow: "none",
    lineHeight: "1",
    float: "right",
  },
  modalClose: {
    width: "16px",
    height: "16px",
  },
  modalBody: {
    paddingTop: "12px",
    paddingRight: "24px",
    paddingBottom: "16px",
    paddingLeft: "24px",
    position: "relative",
  },
  modalFooter: {
    padding: "15px",
    textAlign: "right",
    paddingTop: "0",
    margin: "0",
  },
  modalFooterCenter: {
    marginLeft: "auto",
    marginRight: "auto",
  },
});

const Index = (props: AppProps) => {
  const classes = useStyles();
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<firebase.User>();
  const [createModal, setCreateModal] = React.useState(false);
  let createRoomSchema = yup.object().shape({
    name: yup.string().required(),
    password: yup.string().required(),
  });
  const { register, handleSubmit, errors } = useForm({
    validationSchema: createRoomSchema,
  });

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      setCurrentUser(user);
    } else {
      setCurrentUser(null);
    }
  });

  const createRoom = async (values: any) => {
    console.log(values);
    const roomId = await createRoomDocument(values.name, values.password);
    await updateIsListener(currentUser.uid, true);
    router.push(`/room/${roomId}?type=speaker`);
  };
  const enterRoom = async (roomId: string) => {
    await updateIsListener(currentUser.uid, false);
    router.push(`/room/${roomId}?type=listener`);
  };
  const loginUser = () => {
    handleGoogleLogin();
  };
  const resetContentAndClose = () => {
    setCreateModal(false);
    console.log("close");
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
          <Dialog open={createModal} keepMounted onClose={resetContentAndClose}>
            <DialogTitle disableTypography className={classes.modalHeader}>
              <IconButton
                color="inherit"
                onClick={resetContentAndClose}
                className={classes.modalCloseButton}
              >
                <Close className={classes.modalClose}></Close>
              </IconButton>
              <h4 className={classes.modalTitle}>
                Please type name and password of the new room.
              </h4>
            </DialogTitle>
            <DialogContent className={classes.modalBody}>
              <TextField
                name="name"
                label="Room Name"
                fullWidth
                inputRef={register}
                error={errors.name ? true : false}
              />
              <TextField
                name="password"
                label="Room Password"
                fullWidth
                inputRef={register}
                error={errors.password ? true : false}
              />
            </DialogContent>
            <DialogActions
              className={classes.modalFooter + " " + classes.modalFooterCenter}
            >
              <Button variant="contained" onClick={resetContentAndClose}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit(createRoom)}
                color="primary"
              >
                Create
              </Button>
            </DialogActions>
          </Dialog>
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
