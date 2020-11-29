import { Box } from "@chakra-ui/react";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export const Container = (props: Props) => {
  const { children } = props;
  return (
    <Box w="100%" maxH="100%" h="100vh" bg="gray.100" pt="80px">
      {children}
    </Box>
  );
};
