import firebase from "../plugins/firebase";
import { RoomDocument, UserDocument } from "./model";
import { FirestoreSimple } from "@firestore-simple/web";
import { isUndefined } from "util";

const firestoreSimple = new FirestoreSimple(firebase.firestore());
const roomsDao = firestoreSimple.collection<RoomDocument>({ path: `rooms` });
const usersDao = firestoreSimple.collection<UserDocument>({ path: `users` });

export const fetchRoom = async (id: string) => {
  return await roomsDao.fetch(id);
};

export const fetchUser = async (id: string) => {
  return await usersDao.fetch(id);
};

export const fetchRoomAll = async () => {
  return await roomsDao.fetchAll();
};

export const selectRoomDocuments = async () => {
  const db = firebase.firestore();
  return db.collection("rooms");
};

export const createRoom = async (
  user: firebase.User,
  name: string,
  password: string
) => {
  const admin: UserDocument = await fetchUser(user.uid);
  const newDocId = await roomsDao.add({
    name: name,
    adminUid: user.uid,
    admin: admin.name,
    password: password,
    users: [admin],
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return newDocId;
};

export const updateRoomDocumentWhenJoined = async (
  docId: string,
  userDocument: UserDocument
) => {
  await roomsDao.update({
    id: docId,
    users: firebase.firestore.FieldValue.arrayUnion(userDocument),
  });
};

export const updateRoomDocumentWhenLeaved = async (
  docId: string,
  userDocument: UserDocument
) => {
  await roomsDao.update({
    id: docId,
    users: firebase.firestore.FieldValue.arrayRemove(userDocument),
  });
};

export const insertUser = async (userDocument: UserDocument) => {
  await usersDao.set(userDocument);
};

export const isCreatedUser = async (uid: string) => {
  const user = await usersDao.fetch(uid);
  return !isUndefined(user);
};

export const updateUsername = async (uid: string, name: string) => {
  await usersDao.update({
    id: uid,
    name: name,
  });
};

export const updateIsListener = async (uid: string, isListener: boolean) => {
  await usersDao.update({
    id: uid,
    isListener: isListener,
  });
};

export const deleteRoomDocument = async (roomId: string) => {
  await roomsDao.delete(roomId);
};
