import React from "react";
import firebase from "../plugins/firebase";
import { handleLogout } from "../lib/auth";
import {
  getRoomDao,
  getUserDao,
  updateNickname,
  insertUser,
  availableDao,
  fetchUser,
} from "../lib/database";
import { RoomDocument, UserDocument, AvailableDocument } from "../lib/model";
import CreateDialog from "../components/dialogs/createDialog";
import EnterDialog from "../components/dialogs/enterDialog";
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
import SignInScreen from "../components/signInScreen";

const Index = () => {
  const [currentUser, setCurrentUser] = React.useState<firebase.User>();
  const [currentNickname, setNickname] = React.useState("");
  const [createModal, setCreateModal] = React.useState(false);
  const [enterModal, setEnterModal] = React.useState(false);
  const [selectRoom, setSelectRoom] = React.useState(null);
  const [available, setAvailable] = React.useState(false);
  const [rooms, setRooms] = React.useState(Array<RoomDocument>());
  const [isLoading, setLoading] = React.useState(false);

  const nicknameForm = useForm();

  React.useEffect(() => {
    const roomDao = getRoomDao();
    const unsubscribed = roomDao.onSnapshot((snapshot, toObject) => {
      const newRooms: RoomDocument[] = [];
      snapshot.docs.forEach((element) => {
        const object = toObject(element);
        newRooms.push(object);
      });
      setRooms(newRooms);
    });
    return () => unsubscribed();
  }, []);

  React.useEffect(() => {
    if (currentUser !== null) {
      const userDao = getUserDao();
      const unsubscribed = userDao.onSnapshot((snapshot, toObject) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            const changedUser = toObject(change.doc);
            if (changedUser.email === currentUser.email) {
              setNickname(changedUser.nickname);
            }
          }
        });
      });

      const availableUnsubscribed = availableDao.onSnapshot(
        (snapshot, toObject) => {
          const availables: AvailableDocument[] = snapshot.docs.map(
            (element) => {
              return toObject(element);
            }
          );
          let flag = false;
          availables.forEach((val, _, __) => {
            if (val.userId === currentUser.uid) {
              flag = true;
            }
          });
          setAvailable(flag);
        }
      );
      return () => {
        unsubscribed();
        availableUnsubscribed();
      };
    }
  }, [currentUser]);

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      const userDocument: UserDocument = {
        id: user.uid,
        name: user.displayName,
        nickname: user.displayName,
        isListener: false,
        email: user.email,
      };
      (async () => {
        const fetchedUser = await fetchUser(user.uid);
        if (!!fetchedUser) return;
        await insertUser(userDocument);
      })();
      setCurrentUser(user);
    } else {
      setCurrentUser(null);
    }
  });

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
              {available ? (
                <Button onClick={() => setCreateModal(true)} mr="2">
                  Create Room
                </Button>
              ) : null}
              <Button onClick={logoutUser} mr="2">
                Logout
              </Button>
            </Stack>
          ) : null}
        </Flex>
      </Box>
      <Box w="100%" h="200vh" bg="gray.100" pt="80px">
        {!!currentUser ? (
          <Stack p="4">
            <form
              onSubmit={nicknameForm.handleSubmit(async (values) => {
                setLoading(true);
                updateNickname(currentUser.uid, values.name).then((val) => {
                  setLoading(false);
                });
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
                    key={room.id}
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
            />
            <EnterDialog
              selectRoom={selectRoom}
              currentUser={currentUser}
              isOpen={enterModal}
              closeModal={() => {
                setEnterModal(false);
                setSelectRoom(null);
              }}
            />
          </Stack>
        ) : (
          <SignInScreen />
        )}
      </Box>
    </>
  );
};

// Index.getInitialProps = async () => {
//   return {};
// };

export default Index;
