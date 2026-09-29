export type UserRole = "owner" | "admin" | "editor" | "viewer";

export interface Session {
  userId: string;
  activeOrgId: string;
  role: UserRole;
}

export interface AuthService {
  getSession(): Promise<Session | null>;
  signIn(email: string, password: string): Promise<{ error?: string }>;
  signUp(email: string, password: string): Promise<{ error?: string }>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<{ error?: string }>;
  updatePassword(password: string): Promise<{ error?: string }>;
  getUser(): Promise<{ id: string; email: string } | null>;
}