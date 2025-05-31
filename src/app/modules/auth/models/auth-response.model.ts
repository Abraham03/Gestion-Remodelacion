export interface AuthResponse {
    token: string;
    refreshToken?: string;
    id: number;
    username: string;
    authorities: string[];
    expirationDate: string;
    type: string;
  }