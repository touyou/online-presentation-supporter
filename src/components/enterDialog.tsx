import React from "react";
import {
  makeStyles,
  Dialog,
  DialogTitle,
  IconButton,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from "@material-ui/core";
import { useRouter } from "next/router";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import {
  updateIsListener,
  selectUser,
  updateRoomDocumentWhenJoined,
} from "../lib/database";
import { Close } from "@material-ui/icons";
import { RoomDocument } from "../lib/model";

interface Props {
  selectRoom: RoomDocument;
  currentUser: firebase.User;
  isOpen: boolean;
  closeModal: () => void;
}

const useStyles = makeStyles({
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

const EnterDialog = (props: Props) => {
  const classes = useStyles();
  const router = useRouter();

  let enterRoomSchema = yup.object().shape({
    password: yup.string().required(),
  });
  const enterForm = useForm({
    validationSchema: enterRoomSchema,
  });

  const enterRoom = async (roomId: string, password: string) => {
    if (props.selectRoom.password === password) {
      await updateIsListener(props.currentUser.uid, false);
      const user = await selectUser(props.currentUser.uid);
      await updateRoomDocumentWhenJoined(props.selectRoom.uid, user);
      router.push(`/room/${roomId}?type=listener`);
    } else {
      enterForm.setError("password", null);
    }
  };

  return (
    <Dialog open={props.isOpen} keepMounted onClose={props.closeModal}>
      <DialogTitle disableTypography className={classes.modalHeader}>
        <IconButton
          color="inherit"
          onClick={props.closeModal}
          className={classes.modalCloseButton}
        >
          <Close className={classes.modalClose}></Close>
        </IconButton>
        <h4 className={classes.modalTitle}>
          Please type password of
          {props.selectRoom !== null ? props.selectRoom.name : "the room"}.
        </h4>
      </DialogTitle>
      <DialogContent className={classes.modalBody}>
        <TextField
          name="password"
          label="Room Password"
          fullWidth
          inputRef={enterForm.register}
          error={enterForm.errors.password ? true : false}
        />
      </DialogContent>
      <DialogActions
        className={classes.modalFooter + " " + classes.modalFooterCenter}
      >
        <Button variant="contained" onClick={props.closeModal}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={enterForm.handleSubmit((values) => {
            enterRoom(props.selectRoom.uid, values.password);
          })}
          color="primary"
        >
          Enter
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnterDialog;
