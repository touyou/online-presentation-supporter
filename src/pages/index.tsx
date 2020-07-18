import React from "react";
import firebase from "../plugins/firebase";
import { handleGoogleLogin, handleLogout } from "../lib/auth";
import { getRoomDao, getUserDao, updateNickname } from "../lib/database";
import { RoomDocument } from "../lib/model";
import CreateDialog from "../components/createDialog";
import EnterDialog from "../components/enterDialog";
import {
  SimpleGrid,
  Box,
  Button,
  Heading,
  Stack,
  Input,
  Flex,
  Text,
} from "@chakra-ui/core";
import { useForm } from "react-hook-form";
import { setLogLevel } from "firebase";

const Index = () => {
  const [currentUser, setCurrentUser] = React.useState<firebase.User>();
  const [currentNickname, setNickname] = React.useState("");
  const [createModal, setCreateModal] = React.useState(false);
  const [enterModal, setEnterModal] = React.useState(false);
  const [selectRoom, setSelectRoom] = React.useState(null);
  const [rooms, setRooms] = React.useState(Array<RoomDocument>());
  const [isLoading, setLoading] = React.useState(false);

  const nicknameForm = useForm();

  React.useEffect(() => {
    const roomDao = getRoomDao();
    const unsubscribed = roomDao.onSnapshot((snapshot, toObject) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const addedRoom = toObject(change.doc);
          console.log(`added ${addedRoom.id}`);
          setRooms(rooms.concat([addedRoom]));
        }
        if (change.type === "modified") {
          console.log(`modify ${change.doc.data()}`);
        }
        if (change.type === "removed") {
          const deletedRoom = toObject(change.doc);
          console.log(`remove ${deletedRoom.id}`);
          setRooms(
            rooms.filter((val, _index, _array) => val.id !== deletedRoom.id)
          );
        }
      });
    });
    return () => unsubscribed();
  }, []);

  React.useEffect(() => {
    if (currentUser !== null) {
      const userDao = getUserDao();
      const unsubscribed = userDao.onSnapshot((snapshot, toObject) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            const changedRoom = toObject(change.doc);
            if (changedRoom.email === currentUser.email) {
              setNickname(changedRoom.nickname);
            }
          }
        });
      });
      return () => unsubscribed();
    }
  }, [currentUser]);

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      setCurrentUser(user);
    } else {
      setCurrentUser(null);
    }
  });

  const loginUser = () => {
    handleGoogleLogin();
  };

  const logoutUser = () => {
    handleLogout();
  };

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
          {!!currentUser ? (
            <Stack isInline>
              <Button onClick={() => setCreateModal(true)} mr="2">
                Create Room
              </Button>
              <Button onClick={logoutUser} mr="2">
                Logout
              </Button>
            </Stack>
          ) : (
            <Button onClick={loginUser}>Login</Button>
          )}
        </Flex>
      </Box>
      <Box w="100%" h="200vh" bg="gray.100" pt="80px">
        {!!currentUser ? (
          <Stack p="4">
            <form
              onSubmit={nicknameForm.handleSubmit(async (values) => {
                setLoading(true);
                await updateNickname(currentUser.uid, values.name);
                setLoading(false);
              })}
            >
              <Stack isInline justify="center">
                <Text pt={2} width="13rem" fontSize="md" fontWeight="bold">
                  Now logged in as
                </Text>
                <Input
                  name="name"
                  ref={nicknameForm.register()}
                  value={currentNickname}
                  onChange={(event) => setNickname(event.target.value)}
                />
                <Button
                  isLoading={isLoading}
                  loadingText="Changing"
                  variantColor="teal"
                  type="submit"
                  width="15rem"
                >
                  Change Nickname
                </Button>
              </Stack>
            </form>
            <SimpleGrid columns={[2, null, 4]} spacing="20px" p="4">
              {rooms.map((room: RoomDocument, index: number) => {
                return (
                  <Box
                    borderWidth="1px"
                    rounded="lg"
                    overflow="hidden"
                    bg="white"
                  >
                    <Box p="6">
                      <Heading size="lg" mb="8">
                        {room.name}
                      </Heading>
                      <Button
                        width="100%"
                        variantColor="teal"
                        onClick={() => {
                          setSelectRoom(room);
                          setEnterModal(true);
                        }}
                      >
                        Enter
                      </Button>
                    </Box>
                  </Box>
                );
              })}
            </SimpleGrid>
            <CreateDialog
              currentUser={currentUser}
              isOpen={createModal}
              closeModal={() => setCreateModal(false)}
            ></CreateDialog>
            <EnterDialog
              selectRoom={selectRoom}
              currentUser={currentUser}
              isOpen={enterModal}
              closeModal={() => {
                setEnterModal(false);
                setSelectRoom(null);
              }}
            ></EnterDialog>
          </Stack>
        ) : (
          <div></div>
        )}
      </Box>
    </>
  );
};

Index.getInitialProps = async () => {
  return {};
};

export default Index;
