export interface User {
    id: number;
    username: string;
    authorities: string[];
    token: string;
    refreshToken?: string;
    expirationDate?: string;
    type?: string;
  }