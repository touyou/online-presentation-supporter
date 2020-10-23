import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import ListenerView from "components/listenerView";
import SpeakerView from "components/speakerView";
import firebase from "plugins/firebase";
import { handleLogout } from "lib/auth";
import {
  updateRoomDocumentWhenLeaved,
  fetchUser,
  deleteSelfAnalysis,
  addLog,
  getChatDao,
  getRoomDao,
  deleteSelfPosition,
  archivedRoom,
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
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Text,
  Icon,
  Link,
} from "@chakra-ui/core";
import { useWinndowDimensions } from "../../lib/customHooks";
import {
  ChatDocument,
  UserDocument,
  SlideDocument,
  VideoDocument,
} from "../../lib/model";
import {
  MdMicOff,
  MdMic,
  MdVideocam,
  MdVideocamOff,
  MdPeople,
} from "react-icons/md";
import NewWindow from "react-new-window";
import { ChatView } from "components/chatView";

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
    // Hooks
    const [peer, setPeer] = useState(null);
    const [currentUser, setCurrentUser] = useState<firebase.User>();
    const [currentRoom, setRoom] = useState(null);
    const [screenPeer, setScreenPeer] = useState(null);
    const [videoStream, setVideoStream] = useState(null);
    const [cameraStream, setCameraStream] = useState(null);
    const [screenStream, setScreenStream] = useState(null);
    const [muted, setMuted] = useState(true);
    const [hided, setHided] = useState(true);
    const [chat, setChat] = useState(Array<ChatDocument>());
    const [attendee, setAttendee] = useState(Array<UserDocument>());
    const [isAttendee, setIsAttendee] = useState(false);
    const [slideInfo, setSlideInfo] = useState({
      slides: null,
      currentPage: null,
      playingVideo: null,
    });
    // Ref
    const { isOpen, onOpen, onClose } = useDisclosure();
    const btnRef = useRef();
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
    useEffect(() => {
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
          } else {
            const modifiedRoom = toObject(change.doc);
            if (modifiedRoom.id === roomId) {
              router.back();
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

    useEffect(() => {
      console.log(`screen stream is ${screenStream} ===`);
      if (screenStream !== null && !isListener) {
        joinScreenPeer();
      }
    }, [screenStream]);

    useEffect(() => {
      console.log(`camera stream is ${cameraStream} ===`);
      if (cameraStream !== null && !isListener) {
        joinCameraPeer();
      }
    }, [cameraStream]);

    useEffect(() => {
      if (peer !== null && isListener) {
        peer.once("open", () => {
          joinListenerPeer();
        });
      }
    }, [peer]);

    useEffect(() => {
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
        // micAudio.connect(reverb);
        // reverb.connect(effectedDest);
        micAudio.connect(effectedDest);
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

            addLog(roomId, "speaker_status", "join");
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
        // micAudio.connect(reverb);
        // reverb.connect(effectedDest);
        micAudio.connect(effectedDest);
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
            addLog(roomId, "screen_share", "start");

            const [screenVideoTrack] = stream.getVideoTracks();
            screenVideoTrack.addEventListener(
              "ended",
              () => {
                setScreenStream(null);
                addLog(roomId, "screen_share", "stop");
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
      addLog(roomId, "screen_share", "stop");
    };

    const startSpeakerCamera = (deviceId: string) => {
      const micAudio = new Tone.UserMedia();

      micAudio.open().then(() => {
        const reverb = new Tone.Freeverb();
        const effectedDest = Tone.context.createMediaStreamDestination();
        // micAudio.connect(reverb);
        // reverb.connect(effectedDest);
        micAudio.connect(effectedDest);
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
            addLog(roomId, "speaker_camera", "start");
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
      addLog(roomId, "speaker_camera", "stop");
    };

    const leaveRoom = async () => {
      const userDoc = await fetchUser(currentUser.uid);
      updateRoomDocumentWhenLeaved(roomId, userDoc).then(() => {
        if (!isListener) {
          addLog(roomId, "speaker_status", "left");
          archivedRoom(roomId).then(() => {
            router.back();
          });
        } else {
          const deleteAnalysis = deleteSelfAnalysis(roomId, currentUser.uid);
          const deletePosition = deleteSelfPosition(roomId, currentUser.uid);
          Promise.all([deleteAnalysis, deletePosition]).then(() => {
            router.back();
          });
        }
      });
    };

    const logout = () => {
      handleLogout();
      router.back();
    };

    const toggleMute = () => {
      if (currentRoom === null) return;
      const nowTrack = currentRoom._localStream.getAudioTracks()[0];
      if (!!nowTrack.enabled) {
        nowTrack.enabled = muted;
        if (!isListener) {
          addLog(roomId, "speaker_mic", muted ? "on" : "off");
        }
        setMuted(!muted);
      } else {
        console.log(nowTrack);
      }
    };

    const toggleHide = () => {
      if (currentRoom === null) return;
      const nowTrack = currentRoom._localStream.getVideoTracks()[0];
      if (!!nowTrack.enabled) {
        nowTrack.enabled = hided;
        setHided(!hided);
      } else {
        console.log(nowTrack);
      }
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
              <Flex m={0} align="center" justify="center">
                <Link
                  color="gray.100"
                  href={
                    isListener
                      ? "https://forms.gle/owQrFCF2Mi1QD7pE8"
                      : "https://forms.gle/1AqmK6etJsQnJpD16"
                  }
                  isExternal
                >
                  アンケート <Icon name="external-link" mx="2px" />
                </Link>
              </Flex>
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
        {isOpen ? (
          <NewWindow onUnload={onClose}>
            <ChatView chat={chat} userId={currentUser.uid} roomId={roomId} />
          </NewWindow>
        ) : null}
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
