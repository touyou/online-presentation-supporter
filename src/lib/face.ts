import * as faceapi from "face-api.js";

/// Load model method
export async function loadModels() {
  // const MODEL_URL = process.env.PUBLIC_URL + "/models/face_api";
  const MODEL_URL = "http://localhost:3000" + "/models/face_api";
  await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
  await faceapi.loadFaceExpressionModel(MODEL_URL);
}

/// Get face description
export async function getFaceDescription(blob, inputSize = 512) {
  // tiny_face_detector options
  let scoreThreshold = 0.5;
  const OPTION = new faceapi.TinyFaceDetectorOptions({
    inputSize,
    scoreThreshold,
  });
  const useTinyModel = true;

  // fetch image to api
  let img = await faceapi.fetchImage(blob);

  // detect all faces and generate description from image
  let fullDesc = await faceapi
    .detectAllFaces(img, OPTION)
    .withFaceExpressions();
  return fullDesc;
}
