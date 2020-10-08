import React from "react";
import Webcam from "react-webcam";
import { loadModels, getFaceDescription } from "lib/face";
import { useInterval } from "lib/customHooks";
import {
  euclideanDistance,
  FaceDetection,
  FaceExpressions,
  FaceLandmarks68,
  Point,
} from "face-api.js";
import { AnalysisDataDocument } from "lib/model";
import { updateOrAddRoomAnalysis } from "lib/database";

interface Props {
  width: number;
  height: number;
  roomId: string;
  userId: string;
}

const EmotionalVideo = (props: Props) => {
  const webcamRef = React.useRef(null);
  const [detections, setDetections] = React.useState(Array<FaceDetection>());
  const [expressions, setExpressions] = React.useState(
    Array<FaceExpressions>()
  );
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [width, setWidth] = React.useState(props.width);
  const [height, setHeight] = React.useState(props.height);
  const delay = 10000;

  const eyeAspectRatio = (eye: Point[]) => {
    const A = euclideanDistance([eye[1].x, eye[1].y], [eye[5].x, eye[5].y]);
    const B = euclideanDistance([eye[2].x, eye[2].y], [eye[4].x, eye[4].y]);
    const C = euclideanDistance([eye[0].x, eye[0].y], [eye[3].x, eye[3].y]);
    return (A + B) / (2.0 * C);
  };

  const calculateEAR = (landmarks: FaceLandmarks68) => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const leftEAR = eyeAspectRatio(leftEye);
    const rightEAR = eyeAspectRatio(rightEye);
    return (leftEAR + rightEAR) / 2.0;
  };

  const capture = async () => {
    if (!!webcamRef.current && isLoaded) {
      if (!webcamRef.current.getScreenshot()) return;
      await getFaceDescription(webcamRef.current.getScreenshot()).then(
        (fullDesc) => {
          if (!!fullDesc) {
            const landmarksArray = fullDesc.map((fd) => fd.landmarks);
            const ear = landmarksArray.map((landmarks) =>
              calculateEAR(landmarks)
            );
            const avgEAR =
              ear.length === 0
                ? 1.0
                : ear.reduce((val1, val2, _, __) => {
                    return val1 + val2;
                  }) / ear.length;

            setDetections(fullDesc.map((fd) => fd.detection));
            const expressions = fullDesc.map((fd) => fd.expressions);
            setExpressions(expressions);
            const expression: FaceExpressions = expressions[0];
            if (!expression) return;
            const doc: AnalysisDataDocument = {
              id: props.userId,
              neutral: expression.neutral,
              happy: expression.happy,
              sad: expression.sad,
              angry: expression.angry,
              fearful: expression.fearful,
              disgusted: expression.disgusted,
              surprised: expression.surprised,
              drawsiness: avgEAR,
            };

            updateOrAddRoomAnalysis(props.roomId, doc);
          }
        }
      );
    }
  };

  const convertExpression = (expression: FaceExpressions) => {
    const expressionArray = expression.asSortedArray();
    return (
      expressionArray[0].expression + ": " + expressionArray[0].probability
    );
  };

  const drawBox = () => {
    return detections.map((detection, i) => {
      const _H = detection.box.height;
      const _W = detection.box.width;
      const _X = detection.box.left;
      const _Y = detection.box.top;
      return (
        <div key={i}>
          <div
            style={{
              position: "absolute",
              border: "solid",
              borderColor: "blue",
              height: _H,
              width: _W,
              transform: `translate(${_X}px,${_Y}px)`,
            }}
          >
            {!!expressions && !!expressions[i] ? (
              <p
                style={{
                  backgroundColor: "blue",
                  border: "solid",
                  borderColor: "blue",
                  width: _W,
                  marginTop: 0,
                  color: "#fff",
                  transform: `translate(-3px, ${_H}px)`,
                }}
              >
                {convertExpression(expressions[i])}
              </p>
            ) : null}
          </div>
        </div>
      );
    });
  };

  /// run only mounted
  React.useEffect(() => {
    const exec = async () => {
      // load face api models
      await loadModels();
      setIsLoaded(true);
    };
    exec();
  }, []);

  /// interval capture
  // run here because nested hooks is not allowed
  useInterval(capture, delay);

  React.useEffect(() => {
    setWidth(props.width);
    setHeight(props.height);
  }, [props.width]);

  return (
    <div
      style={{
        width: width,
        height: height,
      }}
    >
      <div
        style={{
          position: "relative",
          width: width,
        }}
      >
        <div style={{ position: "absolute" }}>
          <Webcam
            audio={true}
            width={width}
            height={height}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: width,
              height: height,
              facingMode: "user",
            }}
          />
        </div>
        {!!detections ? drawBox() : null}
      </div>
    </div>
  );
};

EmotionalVideo.getInitialProps = async () => {
  return {
    width: 1024,
    height: 720,
    roomId: "",
    userId: "",
  };
};

export default EmotionalVideo;
