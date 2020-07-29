/**
 *  Here we will check from time to time if we can access the OpenCV
 *  functions. We will return in a callback if it's been resolved
 *  well (true) or if there has been a timeout (false).
 */
function waitForOpencv(callbackFn, waitTimeMs = 30000, stepTimeMs = 100) {
  if (cv.Mat) callbackFn(true);

  let timeSpentMs = 0
  const interval = setInterval(() => {
    const limitReached = timeSpentMs > waitTimeMs
    if (cv.Mat || limitReached) {
      clearInterval(interval)
      return callbackFn(!limitReached)
    } else {
      timeSpentMs += stepTimeMs
    }
  }, stepTimeMs)
}

/**
 * Complexity
 */
function imageComplexity({
  msg,
  payload
}) {
  const img = cv.matFromImageData(payload.img);
  let grayscale = new cv.Mat();
  cv.cvtColor(img, grayscale, cv.COLOR_RGB2GRAY, 0);
  let dst = new cv.Mat();
  cv.Canny(grayscale, dst, payload.th1, payload.th2, payload.apSize, payload.l2flag);
  postMessage({
    msg,
    payload: analyzeCannyImage(dst)
  });
}

/**
 * Analyze
 */
function analyzeCannyImage(mat) {
  const imageSize = mat.rows * mat.cols;
  const whiteCount = cv.countNonZero(mat);
  return whiteCount / imageSize;
}

/**
 * This exists to capture all the events that are thrown out of the worker
 * into the worker. Without this, there would be no communication possible
 * with the project.
 */
onmessage = function (e) {
  switch (e.data.msg) {
    case 'load': {
      // Import Webassembly script
      self.importScripts('./opencv_wasm.js')
      waitForOpencv(function (success) {
        if (success) postMessage({
          msg: e.data.msg
        })
        else throw new Error('Error on loading OpenCV')
      })
      break
    }
    case 'imageComplexity':
      return imageComplexity(e.data)
    default:
      break
  }
}
