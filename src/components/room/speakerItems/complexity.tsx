import React from "react";
import {
  Stack,
  Alert,
  AlertIcon,
  Button,
  Collapse,
  FormControl,
  FormLabel,
  Input,
} from "@chakra-ui/core";

interface Props {
  complexity: number;
  screenStream?: MediaStream;
}

const Complexity = (props: Props) => {
  const [isOpen, setOpen] = React.useState(false);
  const [threshold, setThreshold] = React.useState(0.2);

  const getComplexityMessage = () => {
    if (props.screenStream === null) return "画面の複雑度を計測します。";
    if (props.complexity >= threshold) {
      return `ゆっくり話してみましょう ${props.complexity}`;
    } else {
      return `わかりやすい画面です ${props.complexity}`;
    }
  };

  const getComplexityStatus = () => {
    if (props.screenStream === null) return "info";
    if (props.complexity >= threshold) {
      return "error";
    } else {
      return "success";
    }
  };

  const onClickSetting = () => {
    setOpen(!isOpen);
  };

  return (
    <Stack m="4" p="4" borderWidth="2px" rounded="lg">
      <Alert status={getComplexityStatus()}>
        <AlertIcon />
        {getComplexityMessage()}
      </Alert>
      <Button variantColor="blue" onClick={onClickSetting}>
        Toggle Setting
      </Button>
      <Collapse mt={4} isOpen={isOpen}>
        <FormControl>
          <FormLabel htmlFor="threshold">Threshold</FormLabel>
          <Input
            name="threshold"
            value={threshold}
            onChange={(event) => setThreshold(event.target.value as number)}
            pr="4.5rem"
          />
        </FormControl>
      </Collapse>
    </Stack>
  );
};

Complexity.getInitialProps = () => {
  return {
    complexity: 0,
    screenStream: null,
  };
};

export default Complexity;