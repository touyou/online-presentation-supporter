import React, { useState } from "react";
import { useRouter } from "next/router";
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
  getRoomDao,
  fetchRoom,
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
import {
  ChatDocument,
  UserDocument,
  SlideDocument,
  VideoDocument,
} from "../../lib/model";
import { formatDate } from "../../lib/utils";
import {
  MdMicOff,
  MdMic,
  MdVideocam,
  MdVideocamOff,
  MdPeople,
} from "react-icons/md";

interface Props {
  stream: MediaStream;
  screenStream: MediaStream;
}

export interface SlideInfo {
  slides?: SlideDocument[];
  currentPage?: number;
  playingVideo?: VideoDocument;
}

const Room = (props: Props) => {
  if (process.browser) {
    // State
    const [peer, setPeer] = useState(null);
    const [currentUser, setCurrentUser] = React.useState<firebase.User>();
    const [currentRoom, setRoom] = useState(null);
    const [screenPeer, setScreenPeer] = useState(null);
    const [videoStream, setVideoStream] = useState(null);
    const [cameraStream, setCameraStream] = useState(null);
    const [screenStream, setScreenStream] = useState(null);
    const [muted, setMuted] = useState(true);
    const [hided, setHided] = useState(true);
    const [chat, setChat] = React.useState(Array<ChatDocument>());
    const [attendee, setAttendee] = React.useState(Array<UserDocument>());
    const [chatContent, setChatContent] = React.useState("");
    const [isAttendee, setIsAttendee] = useState(false);
    const [slideInfo, setSlideInfo] = useState({
      slides: null,
      currentPage: null,
      playingVideo: null,
    });
    // Ref
    const { isOpen, onOpen, onClose } = useDisclosure();
    const btnRef = React.useRef();
    const { width, height } = useWinndowDimensions();
    // Router
    const router = useRouter();
    // Props
    const roomId = router.query.rid as string;
    const isListener = router.query.type !== "speaker";
    // Peer
    let Peer = require("skyway-js");

    /* firebase */
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });

    /* useEffect */
    React.useEffect(() => {
      if (!isListener) {
        const _screenPeer = new Peer({
          key: process.env.SKYWAY_API_KEY,
          debug: 3,
        });
        setScreenPeer(_screenPeer);
      } else {
        setPeer(
          new Peer({
            key: process.env.SKYWAY_API_KEY,
            debug: 3,
          })
        );
      }

      const roomDao = getRoomDao();
      const unsubscribedRoom = roomDao.onSnapshot((snapshot, toObject) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            const modifiedRoom = toObject(change.doc);
            if (modifiedRoom.id === roomId) {
              setAttendee(modifiedRoom.users);
              setSlideInfo({
                slides: modifiedRoom.slides,
                currentPage: modifiedRoom.currentPage,
                playingVideo: !!modifiedRoom.playingVideo
                  ? modifiedRoom.playingVideo
                  : null,
              });
            }
          }
        });
      });

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
      return () => {
        unsubscribed();
        unsubscribedRoom();
      };
    }, []);

    React.useEffect(() => {
      console.log(`screen stream is ${screenStream} ===`);
      if (screenStream !== null && !isListener) {
        joinScreenPeer();
      }
    }, [screenStream]);

    React.useEffect(() => {
      console.log(`camera stream is ${cameraStream} ===`);
      if (cameraStream !== null && !isListener) {
        joinCameraPeer();
      }
    }, [cameraStream]);

    React.useEffect(() => {
      if (peer !== null && isListener) {
        peer.once("open", () => {
          joinListenerPeer();
        });
      }
    }, [peer]);

    React.useEffect(() => {
      if (screenPeer !== null && !isListener) {
        screenPeer.once("open", () => {
          joinSpeakerPeer();
        });
      }
    }, [screenPeer]);

    const roomLogs = (room) => {
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

    /* Skyway Connection */
    const joinListenerPeer = () => {
      if (!peer.open) {
        return;
      }

      console.log("=== prepare peer ===");

      // join room
      const newRoom = peer.joinRoom(roomId, {
        mode: "sfu",
        stream: props.stream,
      });

      roomLogs(newRoom);

      // stream handling
      newRoom.on("stream", async (stream) => {
        if (isListener) {
          const peerId = stream.peerId;
          // TODO: if this is screen or speaker video, set element
          console.log(`=== stream received ${peerId} ===`);
          console.log(stream);
          setScreenStream(stream);
        }
      });

      peer.on("error", console.error);

      setRoom(newRoom);
    };

    const joinSpeakerStream = (stream) => {
      if (!screenPeer.open) return;

      console.log("=== prepare speaker peer ===");

      const newRoom = screenPeer.joinRoom(roomId, {
        mode: "sfu",
        stream: stream,
      });

      roomLogs(newRoom);

      // stream handling
      newRoom.on("stream", async (stream) => {
        console.log(stream);
      });

      screenPeer.on("error", console.error);

      setRoom(newRoom);
    };

    const joinSpeakerPeer = () => {
      const micAudio = new Tone.UserMedia();

      micAudio.open().then(() => {
        const reverb = new Tone.Freeverb();
        const effectedDest = Tone.context.createMediaStreamDestination();
        micAudio.connect(reverb);
        reverb.connect(effectedDest);
        navigator.mediaDevices
          .getUserMedia({
            video: true,
            audio: false,
          })
          .then((stream) => {
            const effectedTrack = effectedDest.stream.getAudioTracks()[0];
            stream.addTrack(effectedTrack);
            joinSpeakerStream(stream);
            setVideoStream(stream);
            stream.getAudioTracks()[0].enabled = false;
            stream.getVideoTracks()[0].enabled = false;

            addLog(roomId, "speaker", "start");
          });
      });
    };

    const joinScreenPeer = () => {
      if (cameraStream !== null) stopSpeakerCamera();
      currentRoom.replaceStream(screenStream);
    };

    const joinCameraPeer = () => {
      if (screenStream !== null) stopScreenShare();
      currentRoom.replaceStream(cameraStream);
    };

    /* Prop methods */
    const startScreenShare = () => {
      const micAudio = new Tone.UserMedia();

      micAudio.open().then(() => {
        const reverb = new Tone.Freeverb();
        const effectedDest = Tone.context.createMediaStreamDestination();
        micAudio.connect(reverb);
        reverb.connect(effectedDest);
        navigator.mediaDevices
          .getDisplayMedia({
            video: {
              width: screen.width,
              height: screen.height,
            },
            audio: false,
          })
          .then((stream) => {
            const effectedTrack = effectedDest.stream.getAudioTracks()[0];
            stream.addTrack(effectedTrack);

            setScreenStream(stream);
            setHided(false);
            setMuted(false);
            addLog(roomId, "screen_status", "start");

            const [screenVideoTrack] = stream.getVideoTracks();
            screenVideoTrack.addEventListener(
              "ended",
              () => {
                setScreenStream(null);
                addLog(roomId, "screen_status", "stop");
              },
              { once: true }
            );
          });
      });
    };

    const stopScreenShare = () => {
      (screenStream as MediaStream)?.getTracks().forEach((track) => {
        track.stop();
      });
      currentRoom.replaceStream(videoStream);
      setScreenStream(null);
      setHided(!videoStream.getVideoTracks()[0].enabled);
      setMuted(!videoStream.getAudioTracks()[0].enabled);
      addLog(roomId, "screen_status", "stop");
    };

    const startSpeakerCamera = (deviceId: string) => {
      const micAudio = new Tone.UserMedia();

      micAudio.open().then(() => {
        const reverb = new Tone.Freeverb();
        const effectedDest = Tone.context.createMediaStreamDestination();
        micAudio.connect(reverb);
        reverb.connect(effectedDest);
        navigator.mediaDevices
          .getUserMedia({
            video: {
              deviceId: {
                exact: deviceId,
              },
            },
            audio: false,
          })
          .then((stream) => {
            const effectedTrack = effectedDest.stream.getAudioTracks()[0];
            stream.addTrack(effectedTrack);
            setHided(false);
            setMuted(false);

            setCameraStream(stream);
            addLog(roomId, "camera_status", "start");
          });
      });
    };

    const stopSpeakerCamera = () => {
      (cameraStream as MediaStream)?.getTracks().forEach((track) => {
        track.stop();
      });
      currentRoom.replaceStream(videoStream);
      setCameraStream(null);
      setHided(!videoStream.getVideoTracks()[0].enabled);
      setMuted(!videoStream.getAudioTracks()[0].enabled);
      addLog(roomId, "camera_status", "stop");
    };

    const leaveRoom = async () => {
      const userDoc = await fetchUser(currentUser.uid);
      updateRoomDocumentWhenLeaved(roomId, userDoc).then(() => {
        if (!isListener) {
          deleteRoomDocument(roomId).then(() => {
            router.back();
          });
        } else {
          deleteSelfAnalysis(roomId, currentUser.uid).then(() => {
            router.back();
          });
        }
      });
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

    const toggleMute = () => {
      if (currentRoom === null) return;
      const nowTrack = currentRoom._localStream.getAudioTracks()[0];
      nowTrack.enabled = muted;
      setMuted(!muted);
    };

    const toggleHide = () => {
      if (currentRoom === null) return;
      const nowTrack = currentRoom._localStream.getVideoTracks()[0];
      nowTrack.enabled = hided;
      setHided(!hided);
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
          zIndex={5}
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
        {isListener ? (
          <ListenerView
            videoStream={videoStream}
            screenStream={screenStream}
            roomId={roomId}
            userId={currentUser != null ? currentUser.uid : ""}
            slideInfo={slideInfo}
          />
        ) : (
          <SpeakerView
            screenStream={screenStream}
            cameraStream={cameraStream}
            onClickStartShare={startScreenShare}
            onClickStopShare={stopScreenShare}
            onClickStartCamera={startSpeakerCamera}
            onClickStopCamera={stopSpeakerCamera}
            roomId={roomId}
            slideInfo={slideInfo}
          />
        )}
        {isListener ? null : (
          <Flex pos="fixed" left={4} bottom={4} zIndex={5}>
            <IconButton
              aria-label="Mute"
              as={muted ? MdMicOff : MdMic}
              p={2}
              onClick={toggleMute}
              boxShadow="lg"
            />
            <IconButton
              aria-label="Hide"
              as={hided ? MdVideocamOff : MdVideocam}
              p={2}
              ml={2}
              onClick={toggleHide}
              boxShadow="lg"
            />
          </Flex>
        )}
        <Flex pos="fixed" right={4} bottom={4} zIndex={5}>
          <IconButton
            aria-label="Open People"
            as={MdPeople}
            p={2}
            mr={2}
            onClick={() => {
              setIsAttendee(true);
            }}
            boxShadow="lg"
          />
          <IconButton
            aria-label="Open chat"
            icon="chat"
            ref={btnRef}
            onClick={onOpen}
            boxShadow="lg"
          />
        </Flex>
        <Drawer
          isOpen={isAttendee}
          placement="right"
          onClose={() => {
            setIsAttendee(false);
          }}
        >
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Attendees</DrawerHeader>
            <DrawerBody pr={0}>
              <Stack
                height={height - 160}
                maxH={height - 160}
                overflowY="scroll"
              >
                {attendee.map((person: UserDocument, _: number) => {
                  return (
                    <Box key={person.id}>
                      <Text fontWeight="bold" fontSize="md">
                        {person.nickname}
                      </Text>
                    </Box>
                  );
                })}
              </Stack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
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
  return {
    stream: null,
    screenStream: null,
  };
};

export default Room;
