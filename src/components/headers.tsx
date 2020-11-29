import { Box, Heading, Flex } from "@chakra-ui/react";
import { ReactNode } from "react";

type Props = {
  children?: ReactNode;
};

export const Header = (props: Props) => {
  const { children } = props;

  return (
    <Box
      pos="fixed"
      w="100%"
      h="80px"
      bg="blue.800"
      p="4"
      boxShadow="md"
      zIndex={2}
    >
      <Flex align="flex-end" justifyContent="space-between">
        <Heading color="gray.100">Online Lecture System</Heading>
        {children}
      </Flex>
    </Box>
  );
};
