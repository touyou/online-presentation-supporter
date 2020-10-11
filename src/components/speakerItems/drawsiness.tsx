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

import { useEffect, useState } from "react";
import {
  Bar,
  LineChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  BarChart,
} from "recharts";

interface Props {
  drawsiness: number[];
}

interface DrawsinessLog {
  average: number;
  sleeperCount: number;
  count: number;
}

const Drawsiness = (props: Props) => {
  const { drawsiness } = props;
  const [isOpen, setOpen] = useState(false);
  const [threshold, setThreshold] = useState(0.25);
  const [drawsinessLog, setDrawsinessLog] = useState<DrawsinessLog[]>([]);

  useEffect(() => {
    if (drawsiness.length > 0) {
      const average =
        drawsiness.reduce((val1, val2, _, __) => {
          return val1 + val2;
        }) / drawsiness.length;
      const sleeperCount = drawsiness.filter((val, _, __) => {
        return val <= threshold;
      }).length;
      const newLog = [
        {
          average: average,
          sleeperCount: sleeperCount,
          count: drawsiness.length,
        } as DrawsinessLog,
      ]
        .concat(drawsinessLog)
        .slice(0, 20);
      setDrawsinessLog(newLog);
    }
  }, [drawsiness]);

  const getReversedArray = () => {
    const copyArray = drawsinessLog;
    copyArray.reverse();
    return copyArray;
  };

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
        <LineChart width={300} height={200} data={getReversedArray()}>
          <XAxis />
          <YAxis />
          <ReferenceLine y={threshold} label="Sleepy" stroke="red" />
          <Line type="monotone" dataKey="average" stroke="#3F51B5" />
        </LineChart>
        <BarChart width={300} height={200} data={getReversedArray()}>
          <XAxis />
          <YAxis />
          <Bar
            dataKey="sleeperCount"
            stackId="counter"
            barSize={20}
            fill="#e57373"
          />
          <Bar dataKey="count" stackId="counter" barSize={20} fill="#9CCC65" />
        </BarChart>
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
