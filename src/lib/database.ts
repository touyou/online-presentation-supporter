import firebase from "../plugins/firebase";
import {
  RoomDocument,
  UserDocument,
  AnalysisDataDocument,
  AnalysisLogDocument,
  LogDocument,
  ChatDocument,
  SlideDocument,
  VideoDocument,
  AvailableDocument,
} from "./model";
import { FirestoreSimple } from "@firestore-simple/web";
import { isUndefined } from "util";

const firestoreSimple = new FirestoreSimple(firebase.firestore());

export const getTimestamp = () => {
  return firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp;
};

export const availableDao = firestoreSimple.collection<AvailableDocument>({
  path: `available`,
});

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

export const updateSlideDocument = async (
  docId: string,
  slides: SlideDocument[]
) => {
  await roomsDao.update({
    id: docId,
    slides: slides,
    currentPage: 0,
  });
};

export const updateCurrentPage = async (docId: string, currentPage: number) => {
  await roomsDao.update({
    id: docId,
    currentPage: currentPage,
  });
};

export const updatePlayingVideo = async (
  docId: string,
  playingVideo?: VideoDocument
) => {
  await roomsDao.update({
    id: docId,
    playingVideo: playingVideo,
  });
};

export const removeSlideDocument = async (docId: string) => {
  await roomsDao.update({
    id: docId,
    slides: null,
    currentPage: null,
    playingVideo: null,
  });
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
 * Chat API
 */

const chatFactory = firestoreSimple.collectionFactory<ChatDocument>({
  decode: (doc) => {
    return {
      id: doc.id,
      uid: doc.uid,
      nickname: doc.nickname,
      content: doc.content,
      timestamp: doc.timestamp,
    };
  },
});

export const addNewChat = async (
  roomId: string,
  user: UserDocument,
  content: string
) => {
  const chatDao = chatFactory.create(`rooms/${roomId}/chat`);
  const id = firebase.firestore().collection(`rooms/${roomId}/chat`).doc().id;
  await chatDao.set({
    id: id,
    uid: user.id,
    nickname: user.nickname,
    content: content,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  });
};

export const getChatDao = (roomId: string) => {
  return chatFactory.create(`rooms/${roomId}/chat`);
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

export const fetchAnalysisLogAutoId = async (roomId: string) => {
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

const logFactory = firestoreSimple.collectionFactory<LogDocument>({
  decode: (doc) => {
    return {
      id: doc.id,
      type: doc.type,
      value: doc.value,
      timestamp: doc.timestamp,
    };
  },
});

export const addLog = async (roomId: string, type: string, value: string) => {
  const logDao = logFactory.create(`rooms/${roomId}/log`);
  const id = firebase.firestore().collection(`rooms/${roomId}/log`).doc().id;
  await logDao.set({
    id: id,
    type: type,
    value: value,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  });
};

/**
 * User API
 */
const usersDao = firestoreSimple.collection<UserDocument>({ path: `users` });

export const getUserDao = () => {
  return usersDao;
};

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

export const updateNickname = async (uid: string, name: string) => {
  await usersDao.update({
    id: uid,
    nickname: name,
  });
};

export const updateIsListener = async (uid: string, isListener: boolean) => {
  await usersDao.update({
    id: uid,
    isListener: isListener,
  });
};
