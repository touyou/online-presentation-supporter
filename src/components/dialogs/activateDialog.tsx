import React from "react";
import { useForm } from "react-hook-form";
import {
  setAvailable,
} from "lib/database";
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
  password: string;
  currentUser: firebase.User;
  isOpen: boolean;
  closeModal: () => void;
}

const ActivateDialog = (props: Props) => {
  const cancelRef = React.useRef();
  const [show, setShow] = React.useState(false);
  const [isLoading, setLoading] = React.useState(false);
  const enterForm = useForm();

  const activateAccount = async (password: string) => {
    setLoading(true);
    await setAvailable(props.currentUser.uid);
    setLoading(false);
    props.closeModal();
  };

  const validatePassword = (value) => {
    let error;
    if (!value) {
      error = "Password is required.";
    } else if (value !== props.password) {
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
          Activate presenter account
        </AlertDialogHeader>
        <AlertDialogCloseButton />
        <form
          onSubmit={enterForm.handleSubmit((values) => {
          activateAccount(values.password);
          })}
        >
          <AlertDialogBody>
            <FormControl isInvalid={enterForm.errors.password}>
              <FormLabel htmlFor="password">Activate Password</FormLabel>
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
              Activate
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ActivateDialog;
