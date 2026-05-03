import { PublicUser } from '../users/user.types';

export type AuthResponse = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

export type LoginInput = {
  email?: string;
  password?: string;
};

export type RegisterInput = {
  name?: string;
  email?: string;
  password?: string;
};

export type GoogleAuthInput = {
  idToken?: string;
};

export type RefreshTokenInput = {
  refreshToken?: string;
};

export type ForgotPasswordInput = {
  email?: string;
};

export type ResetPasswordInput = {
  token?: string;
  password?: string;
  confirmPassword?: string;
};

export type ChangePasswordInput = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export type RefreshTokenRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
};

export type PasswordResetTokenRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
};
