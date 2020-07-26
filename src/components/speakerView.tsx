import React from "react";
import { SortablePane, Pane } from "react-sortable-pane";
import { useWinndowDimensions, useInterval } from "../lib/customHooks";
import ScreenShareView from "./screenShareView";
import {
  selectRoomAnalysis,
  updateOrAddRoomAnalysisLog,
  getTimestamp,
  fetchAnalysisLogAutoId,
  addLog,
} from "../lib/database";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import {
  Button,
  Flex,
  Box,
  Alert,
  AlertIcon,
  FormLabel,
  Switch,
  Stat,
  StatLabel,
  StatNumber,
  Stack,
} from "@chakra-ui/core";
import { AnalysisDataDocument } from "../lib/model";

interface Props {
  screenStream?: MediaStream;
  onClickStartShare: () => void;
  onClickStopShare: () => void;
  roomId: string;
}

interface Emotion {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

const SpeakerView = (props: Props) => {
  if (process.browser) {
    const { width, height } = useWinndowDimensions();
    const [screenStream, setScreenStream] = React.useState(null);
    const contentsWidth = () => {
      return width - 12;
    };
    const [screenWidth, setWidth] = React.useState(contentsWidth() * 0.6);
    const paneResizeStop = (e, key, dir, ref, d) => {
      setWidth(screenWidth + d.width);
    };
    const [emotion, setEmotion] = React.useState({
      neutral: 1.0,
      happy: 0.0,
      sad: 0.0,
      angry: 0.0,
      fearful: 0.0,
      disgusted: 0.0,
      surprised: 0.0,
    });
    const [lastPush, setLastPush] = React.useState(null);
    const [canPush, setCanPush] = React.useState(false);
    const [countOfAttendees, setAttendees] = React.useState(0);

    const delay = 5000;

    const getEmotionArray = () => {
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
          return "感情グラフです。";
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

    const calcAvgEmotion = (key: string, datas: AnalysisDataDocument[]) => {
      if (datas.length === 0) {
        return 0;
      }
      return datas.reduce((a, x) => (a += a[key]), 0.0) / datas.length;
    };

    const updateAnalysis = async () => {
      const analysisDatas = await selectRoomAnalysis(props.roomId);
      const resultObject: Emotion = {
        neutral: calcAvgEmotion("neutral", analysisDatas),
        happy: calcAvgEmotion("happy", analysisDatas),
        sad: calcAvgEmotion("sad", analysisDatas),
        angry: calcAvgEmotion("angry", analysisDatas),
        fearful: calcAvgEmotion("fearful", analysisDatas),
        disgusted: calcAvgEmotion("disgusted", analysisDatas),
        surprised: calcAvgEmotion("surprised", analysisDatas),
      };
      setEmotion(resultObject);
      setAttendees(analysisDatas.length);
      if (analysisDatas.length !== 0) {
        const docId = await fetchAnalysisLogAutoId(props.roomId);
        await updateOrAddRoomAnalysisLog(props.roomId, {
          id: docId,
          ...resultObject,
          count: analysisDatas.length,
          timestamp: getTimestamp(),
        });
      }
    };

    useInterval(updateAnalysis, delay);

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
    }, [emotion]);

    React.useEffect(() => {
      setScreenStream(props.screenStream);
    }, [props.screenStream]);

    return (
      <SortablePane
        direction="horizontal"
        margin={4}
        defaultOrder={["0", "1"]}
        onResizeStop={paneResizeStop}
        style={{ margin: "0px" }}
        isSortable={false}
      >
        <Pane
          key={0}
          size={{ width: screenWidth, height: height - 32 }}
          style={{
            margin: "0px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          resizable={{ x: true, y: false, xy: false }}
        >
          {!!screenStream
            ? (
              <ScreenShareView
                stream={screenStream}
                audio="off"
              />
            )
            : null}
        </Pane>
        <Pane
          key={1}
          size={{ width: width - screenWidth, height: height - 32 }}
          resizable={{ x: false, y: false, xy: false }}
        >
          <Stack
            justify="center"
            mt="80px"
            maxH={height - 32}
            overflowY="scroll"
          >
            <Stat borderWidth="2px" rounded="lg" m="4" p="4">
              <StatLabel>Attendees</StatLabel>
              <StatNumber>{countOfAttendees}</StatNumber>
            </Stat>
            <Stack m="4" p="4" borderWidth="2px" rounded="lg" align="center">
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
              <Alert status={getStatus(getMajorEmotionType())}>
                <AlertIcon />
                {getMessage(getMajorEmotionType())}
              </Alert>
              <Flex mt="1" justify="center" align="center">
                <FormLabel htmlFor="push-notify">
                  Enable Push Notification
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
            <Box m="4" p="4" borderWidth="2px" rounded="lg">
              <Flex>
                <Button
                  variantColor="teal"
                  style={{ margin: "4px" }}
                  onClick={props.onClickStartShare}
                >
                  Start Share
                </Button>
                <Button
                  variantColor="red"
                  style={{ margin: "4px" }}
                  onClick={props.onClickStopShare}
                >
                  Stop Share
                </Button>
              </Flex>
            </Box>
          </Stack>
        </Pane>
      </SortablePane>
    );
  } else {
    return <div></div>;
  }
};

SpeakerView.getInitialProps = () => {
  return {
    screenStream: null,
    onClickStartShare: () => {},
    onClickStopShare: () => {},
  };
};

export default SpeakerView;
