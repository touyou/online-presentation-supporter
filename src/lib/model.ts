export interface UserDocument {
  id: string;
  name: string;
  nickname: string;
  isListener: boolean;
  email: string;
}

export interface AvailableDocument {
  id: string;
  userId: string;
}

export interface RoomDocument {
  id: string;
  name: string;
  adminUid: string;
  admin: string;
  password: string;
  users: UserDocument[];
  slides?: SlideDocument[];
  currentPage?: number;
  playingVideo?: VideoDocument;
  timestamp: firebase.firestore.Timestamp;
}

export interface SlideDocument {
  url: string;
  videos: VideoDocument[];
}

export interface VideoDocument {
  id: string;
  title: string;
  url: string;
  source: string;
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

export interface AnalysisLogDocument {
  id: string;
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
  count: number;
  timestamp: firebase.firestore.Timestamp;
}

export interface LogDocument {
  id: string;
  type: string;
  value: string;
  timestamp: firebase.firestore.Timestamp;
}

export interface ChatDocument {
  id: string;
  uid: string;
  nickname: string;
  content: string;
  timestamp: firebase.firestore.Timestamp;
}
