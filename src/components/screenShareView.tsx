import React from "react";

interface Props {
  stream?: MediaStream;
  audio?: string;
}

const ScreenShareView = (props: Props) => {
  const videoRef = React.useRef(null);
  React.useEffect(() => {
    if (!!videoRef.current && !!props.stream) {
      let stream = props.stream;
      if (props.audio === "off") {
        const audioTracks = stream.getAudioTracks();
        audioTracks.forEach((track, _, __) => {
          stream.removeTrack(track);
        });
      }
      videoRef.current.srcObject = stream;
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
      >
      </video>
    </div>
  );
};

ScreenShareView.getInitialProps = async () => {
  return {
    stream: null,
  };
};

export default ScreenShareView;
