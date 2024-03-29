import React from "react";
import { SortablePane, Pane } from "react-sortable-pane";
import { useWinndowDimensions, useInterval, useScript } from "lib/customHooks";
import StreamPreview from "components/room/screenShareView";
import {
  selectRoomAnalysis,
  updateOrAddRoomAnalysisLog,
  getTimestamp,
  fetchAnalysisLogAutoId,
  removeSlideDocument,
  updateSlideDocument,
  addLog,
  getSlideDao,
  updateMaxCount,
} from "lib/database";
import { Button, Flex, Box, Stack, Select } from "@chakra-ui/react";
import { AnalysisDataDocument, SlidePositionDocument } from "lib/model";
import Attendees from "components/room/speakerItems/attendees";
import Complexity from "components/room/speakerItems/complexity";
import EmotionBox from "components/room/speakerItems/emotionBox";
import SlideSetting from "components/room/speakerItems/slideSetting";
import { convertRespToSlideDocument } from "lib/utils";
import { SlideInfo } from "pages/room/[rid]";
import SlideView from "components/room/slideView";
import Drawsiness from "./speakerItems/drawsiness";

interface Props {
  screenStream?: MediaStream;
  cameraStream?: MediaStream;
  onClickStartShare: () => void;
  onClickStopShare: () => void;
  onClickStartCamera: (deviceId: string) => void;
  onClickStopCamera: () => void;
  roomId: string;
  slideInfo: SlideInfo;
  countOfAllAttendees: number;
}

export interface Emotion {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
  drawsiness: number[];
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
      drawsiness: [],
    });
    const [countOfAttendees, setAttendees] = React.useState(0);
    const [maxAttendees, setMaxAttendees] = React.useState(0);
    const [mediaDevices, setMediaDevices] = React.useState(
      Array<MediaDeviceInfo>()
    );
    const [camera, setCamera] = React.useState(null);
    const [complexity, setComplexity] = React.useState(0);
    useScript("https://apis.google.com/js/api.js");
    const [positions, setPositions] = React.useState(null);

    const delay = 5000;

    let unsubscribed = () => {};

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
        drawsiness: analysisDatas.map((val, _, __) => {
          return val.drawsiness;
        }),
      };
      setEmotion(resultObject);
      setAttendees(analysisDatas.length);
      setMaxAttendees(Math.max(analysisDatas.length, maxAttendees));
      if (analysisDatas.length !== 0) {
        const docId = await fetchAnalysisLogAutoId(props.roomId);
        await updateOrAddRoomAnalysisLog(props.roomId, {
          id: docId,
          ...resultObject,
          count: analysisDatas.length,
          timestamp: getTimestamp(),
        });
        await updateMaxCount(props.roomId, maxAttendees);
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
          ) : !!props.slideInfo.slides ? (
            <SlideView
              isListener={false}
              roomId={props.roomId}
              slideInfo={props.slideInfo}
              screenWidth={screenWidth}
            />
          ) : null}
        </Pane>
        <Pane
          key={1}
          size={{ width: width - screenWidth, height: height - 32 }}
          resizable={{ x: false, y: false, xy: false }}
        >
          <Stack
            justify="top"
            mt="80px"
            maxH={height - 90}
            pb="80px"
            overflowY="scroll"
          >
            <Attendees
              countOfAttendees={countOfAttendees}
              countOfAllAttendees={props.countOfAllAttendees}
            />
            <Drawsiness
              roomId={props.roomId}
              countOfAttendees={countOfAttendees}
            />
            <SlideSetting
              onFetchSlides={(resp) => {
                addLog(props.roomId, "speaker_slide", "start");
                updateSlideDocument(
                  props.roomId,
                  convertRespToSlideDocument(resp)
                );
                (async () => {
                  const slideDao = await getSlideDao(props.roomId);
                  unsubscribed = slideDao.onSnapshot((snapshot, toObject) => {
                    let newPositions: SlidePositionDocument[] = [];
                    snapshot.docs.forEach((element) => {
                      const object = toObject(element);
                      newPositions.push(object);
                    });
                    setPositions(newPositions);
                  });
                })();
              }}
              onResetSlides={() => {
                addLog(props.roomId, "speaker_slide", "stop");
                removeSlideDocument(props.roomId);
                unsubscribed();
                unsubscribed = () => {};
                setPositions(null);
              }}
              positions={positions}
              slideInfo={props.slideInfo}
            />
            <Box m="4" p="4" borderWidth="2px" rounded="lg">
              <Flex>
                <Button
                  colorScheme="teal"
                  style={{ margin: "4px" }}
                  onClick={props.onClickStartShare}
                >
                  Start Share
                </Button>
                <Button
                  colorScheme="red"
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
                    colorScheme="teal"
                    style={{ margin: "4px" }}
                    onClick={() => {
                      if (!camera) return;
                      props.onClickStartCamera(camera);
                    }}
                  >
                    Start Camera
                  </Button>
                  <Button
                    colorScheme="red"
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
            <Complexity complexity={complexity} screenStream={screenStream} />
            <EmotionBox emotion={emotion} roomId={props.roomId} />
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
