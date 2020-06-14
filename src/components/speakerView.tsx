import React from "react";
import { SortablePane, Pane } from "react-sortable-pane";
import { useWinndowDimensions } from "../lib/customHooks";
import ScreenShareView from "./screenShareView";
import { Button } from "@material-ui/core";

interface Props {
  screenStream?: MediaStream;
  onClickStartShare: () => void;
  onClickStopShare: () => void;
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
          <Button
            variant="contained"
            color="primary"
            onClick={props.onClickStartShare}
            style={{ marginBottom: "32px" }}
          >
            Start Share
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={props.onClickStopShare}
          >
            Stop Share
          </Button>
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
