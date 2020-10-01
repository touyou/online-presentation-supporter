import React from "react";
import { useRouter } from "next/router";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { createRoom, updateIsListener } from "lib/database";
import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogBody,
  InputGroup,
  Input,
  InputRightElement,
  Button,
  AlertDialogFooter,
  FormControl,
  FormLabel,
  FormErrorMessage,
} from "@chakra-ui/core";

interface Props {
  currentUser: firebase.User;
  isOpen: boolean;
  closeModal: () => void;
}

const CreateDialog = (props: Props) => {
  const router = useRouter();
  const cancelRef = React.useRef();
  const [show, setShow] = React.useState(false);
  const [isLoading, setLoading] = React.useState(false);

  let createRoomSchema = yup.object().shape({
    name: yup.string().required(),
    password: yup.string().required(),
  });
  const createForm = useForm({
    validationSchema: createRoomSchema,
  });
  const handleCreateRoom = async (values: any) => {
    setLoading(true);
    const roomId = await createRoom(
      props.currentUser,
      values.name,
      values.password
    );
    await updateIsListener(props.currentUser.uid, false);
    setLoading(false);
    router.push(`/room/${roomId}?type=speaker`);
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
          Create Room
        </AlertDialogHeader>
        <AlertDialogCloseButton />
        <form onSubmit={createForm.handleSubmit(handleCreateRoom)}>
          <AlertDialogBody>
            <FormControl
              isInvalid={createForm.errors.name || createForm.errors.password}
            >
              <FormLabel htmlFor="name">Room Name</FormLabel>
              <Input
                name="name"
                ref={createForm.register}
                placeholder="name"
                mb={2}
              ></Input>
              <FormErrorMessage>
                {createForm.errors.name && createForm.errors.name.message}
              </FormErrorMessage>
              <FormLabel htmlFor="password">Room Password</FormLabel>
              <InputGroup size="md">
                <Input
                  name="password"
                  ref={createForm.register}
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
                {createForm.errors.password &&
                  createForm.errors.password.message}
              </FormErrorMessage>
            </FormControl>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={props.closeModal}>
              Cancel
            </Button>
            <Button
              isLoading={isLoading}
              loadingText="Creating"
              variantColor="teal"
              type="submit"
              ml={3}
            >
              Create
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateDialog;
