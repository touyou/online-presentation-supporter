import React, { useState } from "react";
import { useRouter } from "next/dist/client/router";
import ListenerView from "../../components/listenerView";
import SpeakerView from "../../components/speakerView";
import firebase from "../../plugins/firebase";
import { AppBar, Toolbar, Typography, Button } from "@material-ui/core";
import { handleLogout } from "../../lib/auth";
import {
  deleteRoomDocument,
  updateRoomDocumentWhenLeaved,
  fetchUser,
} from "../../lib/database";
import * as Tone from "tone";

interface Props {
  stream: MediaStream;
  screenStream: MediaStream;
}

const Room = (props: Props) => {
  const [peer, setPeer] = useState(null);
  const [currentUser, setCurrentUser] = React.useState<firebase.User>();
  const [screenPeer, setScreenPeer] = useState(null);
  const [videoStream, setVideoStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const micAudio = new Tone.UserMedia();

  // Router
  const router = useRouter();
  const roomId = router.query.rid as string;
  const isListener = router.query.type !== "speaker";

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      setCurrentUser(user);
    } else {
      setCurrentUser(null);
    }
  });

  micAudio.open().then(() => {
    const reverb = new Tone.Freeverb();
    const effectedDest = Tone.context.createMediaStreamDestination();
    micAudio.connect(reverb);
    reverb.connect(effectedDest);

    const effectedTrack = effectedDest.stream.getAudioTracks()[0];
  });

  let Peer;
  if (process.browser) {
    Peer = require("skyway-js");
  }

  React.useEffect(() => {
    if (!isListener) {
      setScreenPeer(
        new Peer({
          key: process.env.SKYWAY_API_KEY,
          debug: 3,
        })
      );
    }
    setPeer(
      new Peer({
        key: process.env.SKYWAY_API_KEY,
        debug: 3,
      })
    );
  }, []);

  React.useEffect(() => {
    console.log(`screen stream is ${screenPeer}`);
    if (screenStream !== null && !isListener) {
      startScreenSharing();
    }
  }, [screenStream]);

  const joinTriggerClick = async () => {
    console.log("=== prepare peer ===");
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
        console.log(`=== stream received ${peerId} ===`);
        console.log(stream);
        if (!!peerId) {
          // setVideoStream(stream);
          setScreenStream(stream);
        }
      }
    });
  };

  const startScreenSharing = async () => {
    if (!screenPeer.open) {
      return;
    }

    console.log("=== prepare scereen peer ==");

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

  const startWatch = () => {
    joinTriggerClick();
  };

  const startShare = () => {
    navigator.mediaDevices
      .getDisplayMedia({
        video: {
          width: 3840,
          height: 2160,
        },
        audio: true,
      })
      .then((stream) => {
        setScreenStream(stream);

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

  const leaveRoom = async () => {
    const userDoc = await fetchUser(currentUser.uid);
    await updateRoomDocumentWhenLeaved(roomId, userDoc);
    if (!isListener) {
      await deleteRoomDocument(roomId);
    }
    router.back();
  };

  const logout = () => {
    handleLogout();
    router.back();
  };

  if (!currentUser) {
    return <div></div>;
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" color="inherit" style={{ flexGrow: 1 }}>
            Online Lecture System
          </Typography>
          <Button
            color="inherit"
            onClick={leaveRoom}
            style={{ marginRight: "8px" }}
          >
            Leave Room
          </Button>
          <Button
            color="inherit"
            onClick={logout}
            style={{ marginRight: "8px" }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      {isListener ? (
        <ListenerView
          videoStream={videoStream}
          screenStream={screenStream}
          onClickStartWatch={startWatch}
          roomId={roomId}
          userId={currentUser != null ? currentUser.uid : ""}
        ></ListenerView>
      ) : (
        <SpeakerView
          screenStream={screenStream}
          onClickStartShare={startShare}
          onClickStopShare={endShare}
          roomId={roomId}
        ></SpeakerView>
      )}
    </>
  );
};

Room.getInitialProps = async () => {
  return {};
};

export default Room;
