import { ChatDocument } from "lib/model";
import { Stack, Text, Input, Box, IconButton, Flex } from "@chakra-ui/react";
import { formatDate } from "lib/utils";
import { useWinndowDimensions } from "lib/customHooks";
import { useEffect, useState } from "react";
import { addNewChat, fetchUser } from "lib/database";
import { MdSend } from "react-icons/md";
import { FaUserSecret } from "react-icons/fa";

type Props = {
  chat: ChatDocument[];
  userId: string;
  roomId: string;
};

export const ChatView = (props: Props) => {
  /// Props
  const { chat, userId, roomId } = props;
  /// Hooks
  const { height } = useWinndowDimensions();
  const [chatContent, setChatContent] = useState("");
  useEffect(() => {}, [chat]);
  /// Functions
  const sendChat = async () => {
    if (chatContent === "") return;
    const user = await fetchUser(userId);
    await addNewChat(roomId, user, chatContent);
    setChatContent("");
  };
  const anonymSendChat = async () => {
    if (chatContent === "") return;
    const user = await fetchUser(userId);
    await addNewChat(
      roomId,
      {
        id: user.id,
        name: user.name,
        nickname: "匿名",
        isListener: user.isListener,
        email: user.email,
      },
      chatContent
    );
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
        pb="100px"
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
      <div
        style={{
          position: "fixed",
          bottom: "0",
          left: "0",
          right: "0",
          backgroundColor: "white",
          height: "120px",
          boxShadow: "0px -5px 25px -5px rgba(17,17,17,0.3)",
        }}
      >
        <Stack pos="fixed" zIndex={5} bottom="4" left="4" right="4">
          <Input
            value={chatContent}
            placeholder="質問・雑談など"
            onChange={(event) => setChatContent(event.target.value)}
            size="md"
            backgroundColor="white"
            padding={4}
          />
          <Flex align="right">
            <IconButton
              aria-label="send"
              as={MdSend}
              colorScheme="teal"
              size="md"
              onClick={sendChat}
              ml={2}
              p={2}
            />
            <IconButton
              aria-label="anonymous send"
              as={FaUserSecret}
              colorScheme="purple"
              size="md"
              onClick={anonymSendChat}
              ml={2}
              p={2}
            />
          </Flex>
        </Stack>
      </div>
    </Box>
  );
};
