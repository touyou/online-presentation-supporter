import React from "react";

interface Props {
  stream?: MediaStream;
}

const ScreenShareView = (props: Props) => {
  const videoRef = React.useRef(null);
  React.useEffect(() => {
    if (!!videoRef.current && !!props.stream) {
      videoRef.current.srcObject = props.stream;
      videoRef.current.play();
    }
  }, [videoRef, props.stream]);
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

ScreenShareView.getInitialProps = async () => {
  return {
    stream: null,
  };
};

export default ScreenShareView;
