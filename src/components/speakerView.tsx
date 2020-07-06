import React from "react";
import { SortablePane, Pane } from "react-sortable-pane";
import { useWinndowDimensions, useInterval } from "../lib/customHooks";
import ScreenShareView from "./screenShareView";
import { Button, Card, CardContent } from "@material-ui/core";
import { selectRoomAnalysis } from "../lib/database";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

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
          <Card style={{ margin: "4px" }}>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card style={{ margin: "4px" }}>
            <CardContent
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Button
                variant="contained"
                color="primary"
                style={{ margin: "4px" }}
                onClick={props.onClickStartShare}
              >
                Start Share
              </Button>
              <Button
                variant="contained"
                color="secondary"
                style={{ margin: "4px" }}
                onClick={props.onClickStopShare}
              >
                Stop Share
              </Button>
            </CardContent>
          </Card>
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
