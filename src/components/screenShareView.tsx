import React from "react";
import cv from "../../services/cv";
import { useInterval } from "../lib/customHooks";

interface Props {
  stream?: MediaStream;
  isSpeaker?: string;
}

const StreamPreview = (props: Props) => {
  const videoRef = React.useRef(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const delay = 10000;

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
      const result = await cv.imageComplexity({
        img: screenshot,
        th1: 50,
        th2: 100,
        apSize: 3,
        l2flag: false,
      });
      console.log(result);
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
  };
};

export default StreamPreview;
