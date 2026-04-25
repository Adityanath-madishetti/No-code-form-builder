export interface LoginResult {
  token: string;
  user: {
    uid: string;
    email: string;
    displayName: string;
  };
}
