import firebase from "../plugins/firebase";
import { RoomDocument, UserDocument } from "./model";

export const selectRoomDocuments = async () => {
  const db = firebase.firestore();
  return db.collection("rooms");
};

export const selectRoomDocument = async (docId: string) => {
  const db = firebase.firestore();
  return db.collection("rooms").doc(docId);
};

export const selectUserDocument = async (id: string) => {
  const db = firebase.firestore();
  return db.collection("users").doc(id);
};

export const createRoomDocument = async (name: string, password: string) => {
  const db = firebase.firestore();
  const newDocId = db.collection("rooms").doc().id;
  await db.collection("rooms").doc(newDocId).set({
    name: name,
    password: password,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return newDocId;
};

export const insertRoomDocument = async (roomDocument: RoomDocument) => {
  const db = firebase.firestore();
  return await db.collection("rooms").add(roomDocument);
};

export const updateRoomDocumentWhenJoined = async (
  docId: string,
  userDocument: UserDocument
) => {
  const db = firebase.firestore();
  await db
    .collection("rooms")
    .doc(docId)
    .update({
      users: firebase.firestore.FieldValue.arrayUnion(userDocument),
    });
};

export const updateRoomDocumentWhenLeaved = async (
  docId: string,
  userDocument: UserDocument
) => {
  const db = firebase.firestore();
  await db
    .collection("rooms")
    .doc(docId)
    .update({
      users: firebase.firestore.FieldValue.arrayRemove(userDocument),
    });
};

export const insertUser = async (userDocument: UserDocument) => {
  const db = firebase.firestore();
  await db.collection("users").doc(userDocument.uid).set(userDocument);
};

export const isCreatedUser = async (uid: string) => {
  const db = firebase.firestore();
  const user = await db.collection("users").doc(uid).get();
  return user.exists;
};

export const selectUser = async (uid: string) => {
  const db = firebase.firestore();
  const user = await db.collection("users").doc(uid).get();
  return user.data() as UserDocument;
};

export const updateUsername = async (uid: string, name: string) => {
  const db = firebase.firestore();
  await db.collection("users").doc(uid).update({
    name,
  });
};

export const updateIsListener = async (uid: string, isListener: boolean) => {
  const db = firebase.firestore();
  await db.collection("users").doc(uid).update({
    isListener,
  });
};

export const deleteRoomDocument = async (roomId: string) => {
  const db = firebase.firestore();
  await db.collection("rooms").doc(roomId).delete();
};
