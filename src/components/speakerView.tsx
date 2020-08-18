import React from "react";
import { SortablePane, Pane } from "react-sortable-pane";
import {
  useWinndowDimensions,
  useInterval,
  useScript,
} from "../lib/customHooks";
import StreamPreview from "./screenShareView";
import {
  selectRoomAnalysis,
  updateOrAddRoomAnalysisLog,
  getTimestamp,
  fetchAnalysisLogAutoId,
} from "../lib/database";
import { Button, Flex, Box, Stack, Select, Text, Input } from "@chakra-ui/core";
import { AnalysisDataDocument } from "../lib/model";
import Attendees from "./speakerItems/attendees";
import Complexity from "./speakerItems/complexity";
import EmotionBox from "./speakerItems/emotionBox";
import SlideSetting from "./speakerItems/slideSetting";

interface Props {
  screenStream?: MediaStream;
  cameraStream?: MediaStream;
  onClickStartShare: () => void;
  onClickStopShare: () => void;
  onClickStartCamera: (deviceId: string) => void;
  onClickStopCamera: () => void;
  roomId: string;
}

export interface Emotion {
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
    const [cameraStream, setCameraStream] = React.useState(null);
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
    const [countOfAttendees, setAttendees] = React.useState(0);
    const [mediaDevices, setMediaDevices] = React.useState(
      Array<MediaDeviceInfo>()
    );
    const [camera, setCamera] = React.useState(null);
    const [complexity, setComplexity] = React.useState(0);
    const [slideDatas, setSlideData] = React.useState(null);
    useScript("https://apis.google.com/js/api.js");

    const delay = 5000;

    const calcAvgEmotion = (key: string, datas: AnalysisDataDocument[]) => {
      if (datas.length === 0) {
        return 0;
      }
      return datas.reduce((a, x) => (a += x[key]), 0.0) / datas.length;
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

    const getDevices = (mediaDevices: MediaDeviceInfo[]) => {
      const cameraDevices = mediaDevices.filter((media, _, __) => {
        return media.kind === "videoinput";
      });
      setMediaDevices(cameraDevices);
    };

    const changeDevice = (event: React.ChangeEvent<HTMLSelectElement>) => {
      setCamera(event.target.value);
    };

    const getScreenshotComplexity = (value) => {
      setComplexity(value);
    };

    React.useEffect(() => {
      navigator.mediaDevices.enumerateDevices().then(getDevices);
    }, []);

    React.useEffect(() => {
      setScreenStream(props.screenStream);
    }, [props.screenStream]);

    React.useEffect(() => {
      setCameraStream(props.cameraStream);
    }, [props.cameraStream]);

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
            <StreamPreview
              stream={screenStream}
              isSpeaker="off"
              onChangeComplexity={getScreenshotComplexity}
            />
          ) : !!cameraStream ? (
            <StreamPreview
              stream={cameraStream}
              isSpeaker="off"
              onChangeComplexity={getScreenshotComplexity}
            />
          ) : !!slideDatas ? (
            <Box>
              {slideDatas.map((slideData) => {
                console.log(slideData.contentUrl);
                return <a href={slideData.contentUrl}>slide</a>;
              })}
            </Box>
          ) : null}
        </Pane>
        <Pane
          key={1}
          size={{ width: width - screenWidth, height: height - 32 }}
          resizable={{ x: false, y: false, xy: false }}
        >
          <Stack justify="top" mt="80px" maxH={height - 90} overflowY="scroll">
            <Attendees countOfAttendees={countOfAttendees} />
            <Complexity complexity={complexity} screenStream={screenStream} />
            <EmotionBox emotion={emotion} roomId={props.roomId} />
            <SlideSetting
              onFetchSlides={(resp) => {
                setSlideData(resp);
              }}
              onResetSlides={() => {
                setSlideData(null);
              }}
            />
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
                  onClick={() => {
                    setComplexity(0);
                    props.onClickStopShare();
                  }}
                >
                  Stop Share
                </Button>
              </Flex>
            </Box>
            <Box m="4" p="4" borderWidth="2px" rounded="lg">
              <Stack>
                <Select placeholder="Select camera" onChange={changeDevice}>
                  {mediaDevices.map((value, _, __) => {
                    return (
                      <option key={value.deviceId} value={value.deviceId}>
                        {value.label}
                      </option>
                    );
                  })}
                </Select>
                <Flex>
                  <Button
                    variantColor="teal"
                    style={{ margin: "4px" }}
                    onClick={() => {
                      if (!camera) return;
                      props.onClickStartCamera(camera);
                    }}
                  >
                    Start Camera
                  </Button>
                  <Button
                    variantColor="red"
                    style={{ margin: "4px" }}
                    onClick={() => {
                      setComplexity(0);
                      props.onClickStopCamera();
                    }}
                  >
                    Stop Camera
                  </Button>
                </Flex>
              </Stack>
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
