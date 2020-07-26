import React, { useState } from "react";
import { useRouter } from "next/dist/client/router";
import ListenerView from "../../components/listenerView";
import SpeakerView from "../../components/speakerView";
import firebase from "../../plugins/firebase";
import { handleLogout } from "../../lib/auth";
import {
  deleteRoomDocument,
  updateRoomDocumentWhenLeaved,
  fetchUser,
  deleteSelfAnalysis,
  addLog,
  getChatDao,
  addNewChat,
} from "../../lib/database";
import * as Tone from "tone";
import {
  Box,
  Button,
  Flex,
  Heading,
  Stack,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerFooter,
  DrawerBody,
  Text,
  Input,
} from "@chakra-ui/core";
import { useWinndowDimensions } from "../../lib/customHooks";
import { ChatDocument } from "../../lib/model";
import { formatDate } from "../../lib/utils";

interface Props {
  stream: MediaStream;
  screenStream: MediaStream;
}

const Room = (props: Props) => {
  if (process.browser) {
    const [peer, setPeer] = useState(null);
    const [currentUser, setCurrentUser] = React.useState<firebase.User>();
    const [screenPeer, setScreenPeer] = useState(null);
    const [videoStream, setVideoStream] = useState(null);
    const [cameraStream, setCameraStream] = useState(null);
    const [screenStream, setScreenStream] = useState(null);
    const [chat, setChat] = React.useState(Array<ChatDocument>());
    const [chatContent, setChatContent] = React.useState("");
    const { isOpen, onOpen, onClose } = useDisclosure();
    const btnRef = React.useRef();
    const { height } = useWinndowDimensions();

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
          }),
        );
      }
      setPeer(
        new Peer({
          key: process.env.SKYWAY_API_KEY,
          debug: 3,
        }),
      );

      const chatDao = getChatDao(roomId);
      const unsubscribed = chatDao
        .orderBy("timestamp")
        .onSnapshot((snapshot, toObject) => {
          const newChat: ChatDocument[] = [];
          snapshot.docs.forEach((element) => {
            const object = toObject(element);
            newChat.push(object);
          });
          setChat(newChat);

          if (!isListener) {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "added") {
                const addedRoom = toObject(change.doc);
                if (!!currentUser && addedRoom.uid !== currentUser.uid) {
                  let Push = require("push.js");
                  Push.create(`New message from ${addedRoom.nickname}`, {
                    body: addedRoom.content,
                    timeout: 5000,
                  });
                }
              }
            });
          }
        });
      return () => unsubscribed();
    }, []);

    React.useEffect(() => {
      console.log(`screen stream is ${screenPeer}`);
      if (screenStream !== null && !isListener) {
        startScreenSharing();
      }
    }, [screenStream]);

    React.useEffect(() => {
      console.log(`camera stream is ${screenPeer}`);
      if (cameraStream !== null && !isListener) {
        startCameraSharing();
      }
    }, [cameraStream]);

    const roomLogs = (room) => {
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
    };

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

      roomLogs(room);

      // stream handling
      room.on("stream", async (stream) => {
        console.log("stream changed");
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

      roomLogs(room);

      // stream handling
      room.on("stream", async (stream) => {
        console.log(stream);
      });
    };

    const startCameraSharing = async () => {
      if (!screenPeer.open) {
        return;
      }

      console.log("=== prepare camera peer ==");

      // join room
      const room = screenPeer.joinRoom(roomId, {
        mode: "sfu",
        stream: cameraStream,
      });

      roomLogs(room);

      // stream handling
      room.on("stream", async (stream) => {});
    };

    const startWatch = () => {
      joinTriggerClick();
    };

    const startShare = () => {
      if (cameraStream !== null) stopSpeakerCamera();
      const micAudio = new Tone.UserMedia();

      micAudio.open().then(() => {
        const reverb = new Tone.Freeverb();
        const effectedDest = Tone.context.createMediaStreamDestination();
        micAudio.connect(reverb);
        reverb.connect(effectedDest);
        navigator.mediaDevices
          .getDisplayMedia({
            video: {
              width: 3840,
              height: 2160,
            },
            audio: true,
          })
          .then((stream) => {
            const effectedTrack = effectedDest.stream.getAudioTracks()[0];
            stream.addTrack(effectedTrack);

            setScreenStream(stream);
            addLog(roomId, "screen_status", "start");

            const [screenVideoTrack] = stream.getVideoTracks();
            screenVideoTrack.addEventListener(
              "ended",
              () => {
                setScreenStream(null);
                addLog(roomId, "screen_status", "stop");
              },
              { once: true },
            );
          });
      });
    };

    const endShare = () => {
      (screenStream as MediaStream)?.getTracks()
        .forEach((track) => track.stop());
      setScreenStream(null);
      addLog(roomId, "screen_status", "stop");
    };

    const startSpeakerCamera = (deviceId: string) => {
      if (screenStream !== null) endShare();
      const micAudio = new Tone.UserMedia();

      micAudio.open().then(() => {
        const reverb = new Tone.Freeverb();
        const effectedDest = Tone.context.createMediaStreamDestination();
        micAudio.connect(reverb);
        reverb.connect(effectedDest);
        navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: {
              exact: deviceId,
            },
          },
          audio: true,
        }).then((stream) => {
          const effectedTrack = effectedDest.stream.getAudioTracks()[0];
          stream.addTrack(effectedTrack);

          setCameraStream(stream);
          addLog(roomId, "camera_status", "start");
        });
      });
    };

    const stopSpeakerCamera = () => {
      (cameraStream as MediaStream)?.getTracks()
        .forEach((track) => track.stop());
      setCameraStream(null);
      addLog(roomId, "camera_status", "stop");
    };

    const leaveRoom = async () => {
      const userDoc = await fetchUser(currentUser.uid);
      await updateRoomDocumentWhenLeaved(roomId, userDoc);
      if (!isListener) {
        deleteRoomDocument(roomId).then(() => {
          router.back();
        });
      } else {
        deleteSelfAnalysis(roomId, currentUser.uid).then(() => {
          router.back();
        });
      }
    };

    const logout = () => {
      handleLogout();
      router.back();
    };

    const sendChat = async () => {
      const user = await fetchUser(currentUser.uid);
      await addNewChat(roomId, user, chatContent);
      setChatContent("");
    };

    if (!currentUser) {
      return <div></div>;
    }

    return (
      <>
        <Box
          pos="fixed"
          w="100%"
          h="80px"
          bg="blue.800"
          p="4"
          boxShadow="md"
          zIndex={2}
        >
          <Flex align="flex-end" justifyContent="space-between">
            <Heading color="gray.100">Online Lecture System</Heading>
            <Stack isInline>
              <Button onClick={leaveRoom} mr="2">
                Leave Room
              </Button>
              <Button onClick={logout} mr="2">
                Logout
              </Button>
            </Stack>
          </Flex>
        </Box>
        {isListener
          ? (
            <ListenerView
              videoStream={videoStream}
              screenStream={screenStream}
              onClickStartWatch={startWatch}
              roomId={roomId}
              userId={currentUser != null ? currentUser.uid : ""}
            />
          )
          : (
            <SpeakerView
              screenStream={screenStream}
              cameraStream={cameraStream}
              onClickStartShare={startShare}
              onClickStopShare={endShare}
              onClickStartCamera={startSpeakerCamera}
              onClickStopCamera={stopSpeakerCamera}
              roomId={roomId}
            />
          )}
        <IconButton
          pos="fixed"
          right={4}
          bottom={4}
          zIndex={2}
          aria-label="Opne chat"
          icon="chat"
          ref={btnRef}
          onClick={onOpen}
        />
        <Drawer
          isOpen={isOpen}
          placement="right"
          onClose={onClose}
          finalFocusRef={btnRef}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Room Chat</DrawerHeader>
            <DrawerBody pr={0}>
              <Stack
                height={height - 160}
                maxH={height - 160}
                overflowY="scroll"
              >
                {chat
                  .map((chat: ChatDocument, _: number) => {
                    return (
                      <Box
                        key={chat.id}
                        borderWidth="1px"
                        rounded="md"
                        p={4}
                        mr={2}
                      >
                        <Stack isInline mb={2} justify="space-between">
                          <Text fontWeight="bold" fontSize="sm">
                            @{chat.nickname}
                          </Text>
                          <Text fontSize="sm">
                            {!!chat.timestamp
                              ? formatDate(chat.timestamp.toDate(), "HH:mm:ss")
                              : ""}
                          </Text>
                        </Stack>
                        <Text>{chat.content}</Text>
                      </Box>
                    );
                  })
                  .reverse()}
              </Stack>
            </DrawerBody>
            <DrawerFooter>
              <Stack isInline spacing={2}>
                <Input
                  value={chatContent}
                  onChange={(event) => setChatContent(event.target.value)}
                />
                <Button variantColor="teal" onClick={sendChat}>
                  Send
                </Button>
              </Stack>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    );
  } else {
    return <div></div>;
  }
};

Room.getInitialProps = async () => {
  return {};
};

export default Room;
