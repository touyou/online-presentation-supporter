import * as Tone from "tone";
const Peer = require("skyway-js");

/**
 * Peerを作成
 */
export const createPeer = () => {
  return new Peer({ key: process.env.SKYWAY_API_KEY, debug: 3 });
};

/**
 * roomのログを定義
 * @param room Room
 */
export const roomLogs = (room) => {
  // logging
  room.once("open", () => {
    console.log(`=== You joined ===\n`);
  });
  room.on("peerJoin", (peerId) => {
    console.log(`=== ${peerId} joined ===\n`);
  });
  room.on("data", ({ data, src }) => {
    console.log(`${src}: ${data}\n`);
  });
  room.on("peerLeave", (peerId) => {
    console.log(`=== ${peerId} left ===\n`);
  });
  room.once("close", () => {
    console.log(`=== You left ===\n`);
  });
};

/**
 * Roomにjoinするための補助関数
 * @param props peerとroomIdとstream,及びonCatchStream
 */
export const joinPeer = (props: {
  peer: any;
  roomId: string;
  stream: MediaStream;
  onCatchStream: (stream: any) => void;
}) => {
  const { peer, roomId, stream, onCatchStream } = props;
  if (!peer.open) return;

  console.log("=== prepare peer ===");

  const newRoom = peer.joinRoom(roomId, {
    mode: "sfu",
    stream: stream,
  });
  roomLogs(newRoom);

  // stream handling
  newRoom.on("stream", onCatchStream);

  peer.on("error", console.error);

  return newRoom;
};

/**
 * 音を加工して使う場合に使う関数
 * 今はいらない（無加工のため）けど一旦リファクタリング
 * @param onOpenAudio 加工済のAudio取得後の処理
 */
export const getEffectedAudioTrack = (onOpenAudio: (dest: any) => void) => {
  const micAudio = new Tone.UserMedia();

  micAudio.open().then(() => {
    const dest = Tone.context.createMediaStreamDestination();
    micAudio.connect(dest);
    onOpenAudio(dest);
  });
};
