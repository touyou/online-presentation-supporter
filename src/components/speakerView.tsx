import React from "react";
import { SortablePane, Pane } from "react-sortable-pane";
import { useWinndowDimensions, useInterval } from "../lib/customHooks";
import ScreenShareView from "./screenShareView";
import { selectRoomAnalysis } from "../lib/database";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import {
  Button,
  Flex,
  Box,
  Alert,
  AlertIcon,
  FormLabel,
  Switch,
} from "@chakra-ui/core";

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

    const updateAnalysis = async () => {
      const analysisDatas = await selectRoomAnalysis(props.roomId);
      const resultObject: Emotion = {
        neutral:
          analysisDatas.reduce((a, x) => (a += x.neutral), 0.0) /
          analysisDatas.length,
        happy:
          analysisDatas.reduce((a, x) => (a += x.happy), 0.0) /
          analysisDatas.length,
        sad:
          analysisDatas.reduce((a, x) => (a += x.sad), 0.0) /
          analysisDatas.length,
        angry:
          analysisDatas.reduce((a, x) => (a += x.angry), 0.0) /
          analysisDatas.length,
        fearful:
          analysisDatas.reduce((a, x) => (a += x.fearful), 0.0) /
          analysisDatas.length,
        disgusted:
          analysisDatas.reduce((a, x) => (a += x.disgusted), 0.0) /
          analysisDatas.length,
        surprised:
          analysisDatas.reduce((a, x) => (a += x.surprised), 0.0) /
          analysisDatas.length,
      };
      setEmotion(resultObject);
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
          {!!screenStream ? (
            <ScreenShareView stream={screenStream}></ScreenShareView>
          ) : null}
        </Pane>
        <Pane
          key={1}
          size={{ width: width - screenWidth, height: height - 32 }}
          style={{
            margin: "0px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
          resizable={{ x: false, y: false, xy: false }}
        >
          <Box m="4" p="4" borderWidth="2px" rounded="lg">
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
            <Flex justify="center" align="center">
              <FormLabel htmlFor="push-notify">
                Enable Push Notification
              </FormLabel>
              <Switch
                id="push-notify"
                isChecked={canPush}
                onChange={() => setCanPush(!canPush)}
              />
            </Flex>
          </Box>

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
