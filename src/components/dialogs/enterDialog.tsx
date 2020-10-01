import React from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import {
  updateIsListener,
  fetchUser,
  updateRoomDocumentWhenJoined,
} from "lib/database";
import { RoomDocument } from "lib/model";
import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogCloseButton,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  AlertDialogFooter,
  FormControl,
  FormLabel,
  FormErrorMessage,
} from "@chakra-ui/core";

interface Props {
  selectRoom: RoomDocument;
  currentUser: firebase.User;
  isOpen: boolean;
  closeModal: () => void;
}

const EnterDialog = (props: Props) => {
  const router = useRouter();
  const cancelRef = React.useRef();
  const [show, setShow] = React.useState(false);
  const [isLoading, setLoading] = React.useState(false);
  const enterForm = useForm();

  const isAdmin = () => {
    return props.selectRoom.adminUid === props.currentUser.uid;
  };

  const enterRoom = async (roomId: string, password: string) => {
    if (isAdmin()) {
      await updateIsListener(props.currentUser.uid, false);
      router.push(`/room/${roomId}?type=speaker`);
      return;
    }
    setLoading(true);
    await updateIsListener(props.currentUser.uid, true);
    const user = await fetchUser(props.currentUser.uid);
    await updateRoomDocumentWhenJoined(props.selectRoom.id, user);
    setLoading(false);
    router.push(`/room/${roomId}?type=listener`);
  };

  const validatePassword = (value) => {
    let error;
    if (!value) {
      error = "Password is required.";
    } else if (value !== props.selectRoom.password) {
      error = "Wrong password.";
    }
    return error || true;
  };

  return (
    <AlertDialog
      isOpen={props.isOpen}
      leastDestructiveRef={cancelRef}
      onClose={props.closeModal}
    >
      <AlertDialogOverlay />
      <AlertDialogContent rounded="lg">
        <AlertDialogHeader fontSize="lg" fontWeight="bold">
          Enter {props.selectRoom !== null ? props.selectRoom.name : "the room"}
        </AlertDialogHeader>
        <AlertDialogCloseButton />
        <form
          onSubmit={enterForm.handleSubmit((values) => {
            enterRoom(props.selectRoom.id, values.password);
          })}
        >
          <AlertDialogBody>
            <FormControl isInvalid={enterForm.errors.password}>
              <FormLabel htmlFor="password">Room Password</FormLabel>
              <InputGroup size="md">
                <Input
                  name="password"
                  ref={enterForm.register({ validate: validatePassword })}
                  pr="4.5rem"
                  placeholder="password"
                  type={show ? "text" : "password"}
                />
                <InputRightElement width="4.5rem">
                  <Button h="1.75rem" size="sm" onClick={() => setShow(!show)}>
                    {show ? "Hide" : "Show"}
                  </Button>
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>
                {enterForm.errors.password && enterForm.errors.password.message}
              </FormErrorMessage>
            </FormControl>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={props.closeModal}>
              Cancel
            </Button>
            <Button
              isLoading={isLoading}
              loadingText="Entering"
              variantColor="teal"
              type="submit"
              ml={3}
            >
              Enter
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EnterDialog;
