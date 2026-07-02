export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

export interface AuthenticatedRequest {
  user?: AuthUser;
}
