import React from "react";
import {
  Stack,
  Alert,
  AlertIcon,
  Flex,
  FormLabel,
  Switch,
} from "@chakra-ui/core";
import { addLog } from "../../lib/database";
import { Emotion } from "../speakerView";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

interface Props {
  emotion: Emotion;
  roomId: string;
}

const EmotionBox = (props: Props) => {
  const [canPush, setCanPush] = React.useState(false);
  const [lastPush, setLastPush] = React.useState(null);

  const getEmotionArray = () => {
    const emotion = props.emotion;
    return [
      { label: "🙂", value: emotion.neutral },
      { label: "😄", value: emotion.happy },
      { label: "😢", value: emotion.sad },
      { label: "😡", value: emotion.angry },
      { label: "😱", value: emotion.fearful },
      { label: "😫", value: emotion.disgusted },
      { label: "😮", value: emotion.surprised },
    ];
  };

  const getMajorEmotionType = () => {
    const emotion = props.emotion;
    const positiveAvg = (emotion.happy + emotion.surprised) / 2;
    const negativeAvg =
      (emotion.sad + emotion.angry + emotion.fearful + emotion.disgusted) / 4;
    if (emotion.neutral >= positiveAvg + negativeAvg) {
      return 0;
    } else if (negativeAvg >= positiveAvg) {
      return -1;
    } else {
      return 1;
    }
  };

  const getMessage = (type: number) => {
    switch (type) {
      case 1:
        return "順調です！";
        break;
      case -1:
        return "理解できていないかもしれません。";
        break;
      default:
        return "通常値です。";
        break;
    }
  };

  const getStatus = (type: number) => {
    switch (type) {
      case 1:
        return "success";
        break;
      case -1:
        return "error";
        break;
      default:
        return "info";
        break;
    }
  };

  React.useEffect(() => {
    let now = new Date();
    if (
      canPush &&
      getMajorEmotionType() == -1 &&
      (!lastPush || lastPush + 20000 < now.getTime())
    ) {
      let Push = require("push.js");
      Push.create("Oops!", {
        body: "もう少し丁寧に解説してみましょう。",
        timeout: 5000,
      });
      setLastPush(now.getTime());
    }
  }, [props.emotion]);

  return (
    <Stack m="4" p="4" borderWidth="2px" rounded="lg" align="center">
      {canPush ? (
        <RadarChart height={250} width={250} data={getEmotionArray()}>
          <PolarGrid />
          <PolarAngleAxis dataKey="label" />
          <Radar
            dataKey="value"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
        </RadarChart>
      ) : null}
      <Alert status={getStatus(getMajorEmotionType())}>
        <AlertIcon />
        {getMessage(getMajorEmotionType())}
      </Alert>
      <Flex mt="1" justify="center" align="center">
        <FormLabel htmlFor="push-notify">
          Enable Emotion Push Notification
        </FormLabel>
        <Switch
          id="push-notify"
          isChecked={canPush}
          onChange={() => {
            addLog(props.roomId, "push_status", canPush ? "off" : "on");
            setCanPush(!canPush);
          }}
        />
      </Flex>
    </Stack>
  );
};

export default EmotionBox;
