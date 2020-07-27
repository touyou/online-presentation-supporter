import React from "react";
import EmotionalVideo from "../components/emotionalVideo";
import StreamPreview from "../components/screenShareView";
import { useWinndowDimensions } from "../lib/customHooks";
import { Button, Box, Flex, Heading } from "@chakra-ui/core";

interface Props {
  videoStream?: MediaStream;
  screenStream?: MediaStream;
  roomId: string;
  userId: string;
}

const ListenerView = (props: Props) => {
  if (process.browser) {
    const { width, height } = useWinndowDimensions();
    const [videoStream, setVideoStream] = React.useState(null);
    const [screenStream, setScreenStream] = React.useState(null);
    const videoRef = React.useRef(null);
    const videoHeight = () => {
      return (width * 9) / 16;
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
      <>
        <Box pos="fixed" zIndex={0} w={width} h={height} bg="tomato">
          <EmotionalVideo
            width={width}
            height={videoHeight()}
            roomId={props.roomId}
            userId={props.userId}
          />
        </Box>
        <Box pos="fixed" mt="80px" zIndex={1} w={width} h={height} bg="white">
          {!!screenStream
            ? (
              <StreamPreview stream={screenStream}></StreamPreview>
            )
            : (
              <Flex justify="center" align="center" h="100%">
                <Heading>Please wait until the start.</Heading>
              </Flex>
            )}
        </Box>
      </>
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
