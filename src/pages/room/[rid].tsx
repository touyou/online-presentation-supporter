import React, { useState } from "react";
import { useRouter } from "next/dist/client/router";
import ListenerView from "../../components/listenerView";
import SpeakerView from "../../components/speakerView";
import Peer from "skyway-js";

interface Props {
  stream: MediaStream;
  screenStream: MediaStream;
}

const Room = (props: Props) => {
  const [peer, setPeer] = useState(null);
  const [screenPeer, setScreenPeer] = useState(null);
  const [videoStream, setVideoStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  // Router
  const router = useRouter();
  const roomId = router.query.rid;
  const isListener = router.query.type === "listener";

  React.useEffect(() => {
    if (!isListener) {
      // setScreenPeer(new Peer({ key: "", debug: 3 }));
    }
    // setPeer(new Peer({ key: "", debug: 3 }));
  }, []);

  const joinTriggerClick = async () => {
    if (!peer.open) {
      return;
    }

    // join room
    const room = peer.joinRoom(roomId, {
      mode: "sfu",
      stream: props.stream,
    });

    // logging
    room.once("open", () => {
      console.log(`=== You joined ===\n`);
    });
    room.once("peerJoin", (peerId) => {
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

    // stream handling
    room.on("stream", async (stream) => {
      if (isListener) {
        const peerId = stream.peerId;
        // TODO: if this is screen or speaker video, set element
        if (!!peerId) {
          setVideoStream(stream);
          setScreenStream(stream);
        }
      }
    });
  };

  const startScreenSharing = async () => {
    if (!screenPeer.open) {
      return;
    }

    // join room
    const room = screenPeer.joinRoom(roomId, {
      mode: "sfu",
      stream: screenStream,
    });

    // logging
    room.once("open", () => {
      console.log(`=== You joined ===\n`);
    });
    room.once("peerJoin", (peerId) => {
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

    // stream handling
    room.on("stream", async (stream) => {});
  };

  const startShare = () => {
    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then((stream) => {
        setScreenStream(stream);
        startScreenSharing();

        const [screenVideoTrack] = stream.getVideoTracks();
        screenVideoTrack.addEventListener(
          "ended",
          () => {
            setScreenStream(null);
          },
          { once: true }
        );
      });
  };

  const endShare = () => {
    (screenStream as MediaStream).getTracks().forEach((track) => track.stop());
    setScreenStream(null);
  };

  return isListener ? (
    <ListenerView
      videoStream={videoStream}
      screenStream={screenStream}
    ></ListenerView>
  ) : (
    <SpeakerView
      screenStream={screenStream}
      onClickStartShare={startShare}
      onClickStopShare={endShare}
    ></SpeakerView>
  );
};

Room.getInitialProps = async () => {
  return {};
};

export default Room;
