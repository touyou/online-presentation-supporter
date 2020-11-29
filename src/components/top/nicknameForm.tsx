import { updateNickname } from "lib/database";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Stack, Input, Text } from "@chakra-ui/react";
import firebase from "plugins/firebase";

type Props = {
  currentUser: firebase.User;
  currentNickname: string;
};

export const NicknameForm = (props: Props) => {
  const { currentUser, currentNickname } = props;
  const [isLoading, setLoading] = useState(false);
  const nicknameForm = useForm();

  const { isDirty, isSubmitting } = nicknameForm.formState;

  useEffect(() => {
    nicknameForm.setValue("name", currentNickname);
  }, [currentNickname]);

  return (
    <form
      onSubmit={nicknameForm.handleSubmit(async (values) => {
        setLoading(true);
        updateNickname(currentUser.uid, values.name).then((val) => {
          setLoading(false);
        });
      })}
    >
      <Stack isInline justify="center">
        <Text pt={2} width="13rem" fontSize="md" fontWeight="bold">
          Now logged in as
        </Text>
        <Input name="name" ref={nicknameForm.register()} />
        <Button
          isLoading={isLoading}
          isDisabled={!isDirty || isSubmitting}
          loadingText="Changing"
          colorScheme="teal"
          type="submit"
          width="15rem"
        >
          Change Nickname
        </Button>
      </Stack>
    </form>
  );
};
