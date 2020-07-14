import firebase from "../plugins/firebase";
import {
  RoomDocument,
  UserDocument,
  AnalysisDataDocument,
  AnalysisLogDocument,
} from "./model";
import { FirestoreSimple } from "@firestore-simple/web";
import { isUndefined } from "util";

const firestoreSimple = new FirestoreSimple(firebase.firestore());

export const getTimestamp = () => {
  return firebase.firestore.FieldValue.serverTimestamp();
};

/**
 * Room API
 */
const roomsDao = firestoreSimple.collection<RoomDocument>({ path: `rooms` });

export const fetchRoom = async (id: string) => {
  return await roomsDao.fetch(id);
};

export const getRoomDao = () => {
  return roomsDao;
};

export const fetchRoomUserCount = async (id: string) => {
  const roomDoc = await roomsDao.fetch(id);
  return roomDoc.users.length;
};

export const fetchRoomAll = async () => {
  return await roomsDao.fetchAll();
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
    timestamp: getTimestamp(),
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

export const deleteRoomDocument = async (roomId: string) => {
  await roomsDao.delete(roomId);
};

/**
 * Room Analysis API
 */

const analysisFactory = firestoreSimple.collectionFactory<AnalysisDataDocument>(
  {
    decode: (doc) => {
      return {
        id: doc.id,
        neutral: doc.neutral,
        happy: doc.happy,
        sad: doc.sad,
        angry: doc.angry,
        fearful: doc.fearful,
        disgusted: doc.disgusted,
        surprised: doc.surprised,
      };
    },
  }
);

export const selectRoomAnalysis = async (id: string) => {
  const analysisDao = analysisFactory.create(`rooms/${id}/analysis`);
  return await analysisDao.fetchAll();
};

export const getAnalysis = (id: string) => {
  return analysisFactory.create(`rooms/${id}/analysis`);
};

export const updateOrAddRoomAnalysis = async (
  roomId: string,
  analysis: AnalysisDataDocument
) => {
  const analysisDao = analysisFactory.create(`rooms/${roomId}/analysis`);
  await analysisDao.set(analysis);
};

export const deleteSelfAnalysis = async (roomId: string, userId: string) => {
  const analysisDao = getAnalysis(roomId);
  await analysisDao.delete(userId);
};

/**
 * Room Log API
 */

const analysisLogFactory = firestoreSimple.collectionFactory<
  AnalysisLogDocument
>({
  decode: (doc) => {
    return {
      id: doc.id,
      neutral: doc.neutral,
      happy: doc.happy,
      sad: doc.sad,
      angry: doc.angry,
      fearful: doc.fearful,
      disgusted: doc.disgusted,
      surprised: doc.surprised,
      count: doc.count,
      timestamp: doc.timestamp,
    };
  },
});

export const fetchLogAutoId = async (roomId: string) => {
  return firebase.firestore().collection(`rooms/${roomId}/analysis-log`).doc()
    .id;
};

export const updateOrAddRoomAnalysisLog = async (
  roomId: string,
  analysis: AnalysisLogDocument
) => {
  const analysisDao = analysisLogFactory.create(`rooms/${roomId}/analysis-log`);
  await analysisDao.set(analysis);
};

/**
 * User API
 */
const usersDao = firestoreSimple.collection<UserDocument>({ path: `users` });

export const fetchUser = async (id: string) => {
  return await usersDao.fetch(id);
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
