import { useEffect, useState } from "react";
import firebase from "plugins/firebase";
import { handleLogout } from "lib/auth";
import {
  getRoomDao,
  getUserDao,
  updateNickname,
  insertUser,
  availableDao,
  fetchUser,
} from "../lib/database";
import { RoomDocument, UserDocument, AvailableDocument } from "lib/model";
import CreateDialog from "components/dialogs/createDialog";
import EnterDialog from "components/dialogs/enterDialog";
import {
  SimpleGrid,
  Box,
  Button,
  Heading,
  Stack,
  Input,
  Text,
} from "@chakra-ui/core";
import { useForm } from "react-hook-form";
import SignInScreen from "components/signInScreen";
import ActivateDialog from "components/dialogs/activateDialog";
import { Header } from "components/headers";
import { Container } from "components/defaultContainer";

const Index = () => {
  const [currentUser, setCurrentUser] = useState<firebase.User>();
  const [currentNickname, setNickname] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [enterModal, setEnterModal] = useState(false);
  const [activateModal, setActivateModal] = useState(false);
  const [selectRoom, setSelectRoom] = useState(null);
  const [available, setAvailable] = useState(false);
  const [rooms, setRooms] = useState(Array<RoomDocument>());
  const [isLoading, setLoading] = useState(false);
  const [activatePassword, setActivatePassword] = useState("");
  const [isAuthLoading, setAuthLoading] = useState(true);

  const nicknameForm = useForm();

  useEffect(() => {
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

      const roomDao = getRoomDao();
      const roomUnsubscribed = roomDao.onSnapshot((snapshot, toObject) => {
        const newRooms: RoomDocument[] = [];
        snapshot.docs.forEach((element) => {
          const object = toObject(element);
          newRooms.push(object);
        });
        setRooms(newRooms);
      });

      const remoteConfig = firebase.remoteConfig();
      remoteConfig.defaultConfig = {
        available_key: "touyou19951121",
      };
      remoteConfig.fetchAndActivate().then(() => {
        setActivatePassword(remoteConfig.getString("available_key"));
      });
      return () => {
        unsubscribed();
        availableUnsubscribed();
        roomUnsubscribed();
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
    setAuthLoading(false);
  });

  const logoutUser = () => {
    handleLogout();
  };

  if (isAuthLoading) {
    return (
      <>
        <Header />
        <Container>Loading...</Container>
      </>
    );
  }

  return (
    <>
      <Header>
        {!!currentUser ? (
          <Stack isInline>
            {available ? (
              <Button onClick={() => setCreateModal(true)} mr="2">
                Create Room
              </Button>
            ) : (
              <Button onClick={() => setActivateModal(true)} mr="2">
                Activate
              </Button>
            )}
            <Button onClick={logoutUser} mr="2">
              Logout
            </Button>
          </Stack>
        ) : null}
      </Header>
      <Container>
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
                if (room.isArchived) return null;
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
            <ActivateDialog
              password={activatePassword}
              currentUser={currentUser}
              isOpen={activateModal}
              closeModal={() => setActivateModal(false)}
            />
          </Stack>
        ) : (
          <SignInScreen />
        )}
      </Container>
    </>
  );
};

export default Index;
