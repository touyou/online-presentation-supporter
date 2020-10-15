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
import { getAnalysisLog } from "lib/database";

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
  roomId: string;
}

interface DrawsinessLog {
  average: number;
  sleeperCount: number;
  goodCount: number;
  count: number;
}

const Drawsiness = (props: Props) => {
  const { roomId } = props;
  const [isOpen, setOpen] = useState(false);
  const [threshold, setThreshold] = useState(0.3);
  const [drawsinessLog, setDrawsinessLog] = useState<DrawsinessLog[]>([]);

  useEffect(() => {
    const analysisDao = getAnalysisLog(roomId);
    return analysisDao
      .orderBy("timestamp", "desc")
      .limit(20)
      .onSnapshot((snapshot, toObject) => {
        const newLogs: DrawsinessLog[] = [];
        snapshot.docs.forEach((element) => {
          const object = toObject(element);
          const drawsiness = object.drawsiness;
          if (drawsiness.length != 0) {
            const average =
              drawsiness.reduce((val1, val2, _, __) => {
                return val1 + val2;
              }) / drawsiness.length;
            const sleeperCount = drawsiness.filter((val, _, __) => {
              return val <= threshold;
            }).length;
            newLogs.push({
              average: average,
              sleeperCount: sleeperCount,
              goodCount: drawsiness.length - sleeperCount,
              count: drawsiness.length,
            } as DrawsinessLog);
          }
        });
        setDrawsinessLog(newLogs);
      });
  }, []);

  const getReversedArray = () => {
    const copyArray = drawsinessLog.slice();
    copyArray.reverse();
    return copyArray;
  };

  const getDrawsinessMessage = () => {
    if (drawsinessLog.length == 0) return `眠気推定の結果を表示します`;
    const latestLog = drawsinessLog[0];
    return `少し眠たい人が${latestLog.count}人中${latestLog.sleeperCount}人います。`;
  };

  const getDrawsinessStatus = () => {
    if (drawsinessLog.length == 0) return "info";
    const latestLog = drawsinessLog[0];
    const ratio = latestLog.sleeperCount / latestLog.count;
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
        Toggle Setting and Graph
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
          <Bar
            dataKey="goodCount"
            stackId="counter"
            barSize={20}
            fill="#9CCC65"
          />
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
