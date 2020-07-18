import firebase from "../plugins/firebase";
import { isCreatedUser, insertUser } from "./database";
import { UserDocument } from "./model";

export function getCurrentUser(): Promise<firebase.User | boolean> {
  return new Promise((resolve) => {
    firebase.auth().onAuthStateChanged((user: firebase.User | null) => {
      resolve(user || false);
    });
  });
}

export const handleGoogleLogin = async () => {
  const googleAuthProvider = new firebase.auth.GoogleAuthProvider();
  const result = await firebase.auth().signInWithPopup(googleAuthProvider);
  const uid = result.user?.uid;

  if (!!uid && !(await isCreatedUser(uid))) {
    const userObj = result.user as firebase.User;
    const userDocument: UserDocument = {
      id: userObj.uid,
      name: userObj.displayName,
      nickname: userObj.displayName,
      isListener: false,
      email: userObj.email,
    };
    await insertUser(userDocument);
  }
};

export const handleLogout = async () => {
  await firebase.auth().signOut();
};
