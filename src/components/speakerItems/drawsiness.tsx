import {
  Alert,
  AlertIcon,
  Button,
  Collapse,
  FormControl,
  FormLabel,
  Stack,
  Input,
} from "@chakra-ui/core";

import { useState } from "react";

interface Props {
  drawsiness: number[];
}

const Drawsiness = (props: Props) => {
  const { drawsiness } = props;
  const [isOpen, setOpen] = useState(false);
  const [threshold, setThreshold] = useState(0.25);

  const getDrawsinessMessage = () => {
    const sleeper = drawsiness.filter((val, _, __) => {
      return val <= threshold;
    });
    return `${drawsiness.length}人中${sleeper.length}人が眠気に襲われています。`;
  };

  const getDrawsinessStatus = () => {
    if (drawsiness.length <= 0) return "info";
    const sleeper = drawsiness.filter((val, _, __) => {
      return val <= threshold;
    });
    const ratio = sleeper.length / drawsiness.length;
    if (ratio >= 0.25) return "error";
    else return "success";
  };

  const onClickSetting = () => {
    setOpen(!isOpen);
  };

  return (
    <Stack m="4" p="4" borderWidth="2px" rounded="lg">
      <Alert status={getDrawsinessStatus()}>
        <AlertIcon />
        {getDrawsinessMessage()}
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

Drawsiness.getInitialProps = () => {
  return {
    drawsiness: [],
  };
};

export default Drawsiness;
