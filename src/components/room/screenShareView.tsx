import React from "react";
import cv from "services/cv";
import { useInterval } from "lib/customHooks";
import { calculateComplexity } from "lib/utils";

interface Props {
  stream?: MediaStream;
  isSpeaker?: string;
  onChangeComplexity?: (number) => void;
}

const StreamPreview = (props: Props) => {
  const videoRef = React.useRef(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const delay = 1000;

  React.useEffect(() => {
    console.log("loading");
    const exec = async () => {
      await cv.load();
      console.log("done");
      setIsLoaded(true);
    };
    exec();
  }, []);

  React.useEffect(() => {
    if (!!videoRef.current && !!props.stream) {
      let stream = props.stream;
      if (props.isSpeaker === "off") {
        const audioTracks = stream.getAudioTracks();
        audioTracks.forEach((track, _, __) => {
          stream.removeTrack(track);
        });
      }
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  }, [videoRef, props.stream]);

  const getScreenshot = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.width;
    canvas.height = videoRef.current.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  const capture = async () => {
    if (!!videoRef.current && isLoaded) {
      const screenshot = getScreenshot();
      if (!screenshot) return;
      const result = await calculateComplexity(screenshot);
      if (props.isSpeaker) props.onChangeComplexity(result.data.payload);
    }
  };

  useInterval(capture, delay);

  return (
    <div>
      <video
        ref={videoRef}
        width="100%"
        height="100%"
        autoPlay
        playsInline
      ></video>
    </div>
  );
};

StreamPreview.getInitialProps = async () => {
  return {
    stream: null,
    isSpeaker: null,
    onChangeComplexity: null,
  };
};

export default StreamPreview;
