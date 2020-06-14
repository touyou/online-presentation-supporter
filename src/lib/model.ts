export interface UserDocument {
  uid: string;
  name: string;
  isListener: boolean;
}

export interface RoomDocument {
  uid: string;
  name: string;
  adminUid: string;
  admin: string;
  users: UserDocument[];
}
