import * as functions from "firebase-functions";
import * as io from "socket.io-client";

function generateUuid() {
  // https://github.com/GoogleChrome/chrome-platform-analytics/blob/master/src/internal/identifier.js
  // const FORMAT: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  const chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("");
  for (let i = 0, len = chars.length; i < len; i++) {
    switch (chars[i]) {
      case "x":
        chars[i] = Math.floor(Math.random() * 16).toString(16);
        break;
      case "y":
        chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
        break;
    }
  }
  return chars.join("");
}

// const sleep = (msec: number) =>
//   new Promise((resolve) => setTimeout(resolve, msec));

export const sendCommentScreen = functions.firestore
  .document("rooms/{roomId}/chat/{chatId}")
  .onCreate((snap, context) => {
    const roomId = context.params.roomId;
    const newValue = snap.data();
    const post = {
      position: "opt_ue",
      size: "opt_small",
      color: "#190707",
      text: newValue.content,
      uuid: generateUuid(),
      date: new Date().getTime(),
    };
    const message = JSON.stringify(post);
    console.log("send message to " + roomId + ": " + message);
  });
