export interface UserDocument {
  id: string;
  name: string;
  isListener: boolean;
}

export interface RoomDocument {
  id: string;
  name: string;
  adminUid: string;
  admin: string;
  password: string;
  users: UserDocument[];
  timestamp: firebase.firestore.FieldValue;
}
