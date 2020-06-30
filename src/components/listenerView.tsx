import React from "react";
import EmotionalVideo from "../components/emotionalVideo";
import { SortablePane, Pane } from "react-sortable-pane";
import ScreenShareView from "../components/screenShareView";
import { useWinndowDimensions } from "../lib/customHooks";
import { Button } from "@material-ui/core";

interface Props {
  videoStream?: MediaStream;
  screenStream?: MediaStream;
  onClickStartWatch: () => void;
  roomId: string;
  userId: string;
}

const ListenerView = (props: Props) => {
  if (process.browser) {
    const { width, height } = useWinndowDimensions();
    const [videoStream, setVideoStream] = React.useState(null);
    const [screenStream, setScreenStream] = React.useState(null);
    const videoRef = React.useRef(null);
    const contentsWidth = () => {
      return width - 12;
    };
    const [videoWidth, setWidth] = React.useState(contentsWidth() * 0.4);
    const videoHeight = () => {
      return (videoWidth * 9) / 16;
    };
    const paneResizeStop = (e, key, dir, ref, d) => {
      setWidth(videoWidth - d.width);
    };

    React.useEffect(() => {
      setVideoStream(props.videoStream);
      if (!!videoRef.current && !!props.videoStream) {
        videoRef.current.srcObject = props.videoStream;
        videoRef.current.play();
      }
    }, [videoRef, props.videoStream]);
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
          size={{ width: width - videoWidth, height: height - 32 }}
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
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={props.onClickStartWatch}
              style={{ marginBottom: "32px" }}
            >
              Start Share
            </Button>
          )}
        </Pane>
        <Pane
          key={1}
          size={{ width: videoWidth, height: height - 32 }}
          style={{
            margin: "0px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
          resizable={{ x: false, y: false, xy: false }}
        >
          {!!videoStream ? (
            <video
              ref={videoRef}
              width={videoWidth}
              height={videoHeight()}
              style={{
                backgroundColor: "white",
              }}
              autoPlay
              playsInline
            ></video>
          ) : null}
          <EmotionalVideo
            width={videoWidth}
            height={videoHeight()}
            roomId={props.roomId}
            userId={props.userId}
          ></EmotionalVideo>
        </Pane>
      </SortablePane>
    );
  } else {
    return <div></div>;
  }
};

ListenerView.getInitialProps = () => {
  return {
    videoStream: null,
    screenStream: null,
    roomId: "",
    userId: "",
  };
};

export default ListenerView;
