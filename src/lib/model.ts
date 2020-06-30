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

export interface AnalysisDataDocument {
  id: string;
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}
