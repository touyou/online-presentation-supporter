import Ticker from "react-ticker";
import { Box, Text } from "@chakra-ui/react";
import { ChatDocument } from "lib/model";
import { useEffect, useState } from "react";

const outline = (size: number, color: string) => {
  const doubleSize = size * size;
  return `${doubleSize}px 0 0 ${color},
          -${doubleSize}px 0 0 ${color},
          0 ${doubleSize}px 0 ${color},
          0 -${doubleSize}px 0 ${color},
          ${size}px ${size}px 0 ${color},
          -${size}px -${size}px 0 ${color},
          -${size}px ${size}px 0 ${color},
          ${size}px -${size}px 0 ${color};`;
};

export const ChatTicker = (props: { chat: Array<ChatDocument> }) => {
  const { chat } = props;
  const [chatContents, setContents] = useState([]);
  const [currentIndex, setIndex] = useState(0);

  useEffect(() => {
    setContents(chat.map((value) => value.content));
  }, [chat]);

  return (
    <Box pos="fixed" w="100%" h="50px" pt="2" mt="80px" zIndex={5}>
      <Ticker offset="run-in" speed={10}>
        {() => {
          if (currentIndex < chatContents.length) {
            setIndex(currentIndex + 1);
            return (
              <Text
                fontSize={20}
                fontWeight="bold"
                color="white"
                letterSpacing="4px"
                textShadow={outline(1.5, "#333")}
                whiteSpace="nowrap"
                mr="100px"
              >
                {chatContents[currentIndex]}
              </Text>
            );
          }

          return (
            <Text fontSize="sm" visibility="hidden">
              Placeholder
            </Text>
          );
        }}
      </Ticker>
    </Box>
  );
};
