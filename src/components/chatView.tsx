import { ChatDocument } from "lib/model";
import { Stack, Text, Input, Box, Button } from "@chakra-ui/core";
import { formatDate } from "lib/utils";
import { useWinndowDimensions } from "lib/customHooks";
import { useEffect, useState } from "react";
import { addNewChat, fetchUser } from "lib/database";
import type { User } from "firebase";

type Props = {
  chat: ChatDocument[];
  userId: string;
  roomId: string;
};

export const ChatView = (props: Props) => {
  /// Props
  const { chat, userId, roomId } = props;
  /// Hooks
  const { width, height } = useWinndowDimensions();
  const [chatContent, setChatContent] = useState("");
  useEffect(() => {}, [chat]);
  /// Functions
  const sendChat = async () => {
    const user = await fetchUser(userId);
    await addNewChat(roomId, user, chatContent);
    setChatContent("");
  };

  return (
    <Box p={4}>
      <Box pos="fixed" top="0" left="0" w="100%" h="40px" bg="blue.800">
        <Text m={2} fontSize="md" fontWeight="bold" color="white">
          Room Chat
        </Text>
      </Box>
      <Stack
        pt="40px"
        height={height - 240}
        maxH={height - 240}
        overflowY="scroll"
      >
        {chat
          .map((chat: ChatDocument, _: number) => {
            return (
              <Box key={chat.id} borderWidth="1px" rounded="md" p={4} mr={2}>
                <Stack isInline mb={2} justify="space-between">
                  <Text fontWeight="bold" fontSize="sm">
                    @{chat.nickname}
                  </Text>
                  <Text fontSize="sm">
                    {!!chat.timestamp
                      ? formatDate(chat.timestamp.toDate(), "HH:mm:ss")
                      : ""}
                  </Text>
                </Stack>
                <Text>{chat.content}</Text>
              </Box>
            );
          })
          .reverse()}
      </Stack>
      <Stack isInline spacing={2} pos="fixed" bottom="4" left="4" right="4">
        <Input
          value={chatContent}
          onChange={(event) => setChatContent(event.target.value)}
        />
        <Button variantColor="teal" onClick={sendChat}>
          Send
        </Button>
      </Stack>
    </Box>
  );
};
