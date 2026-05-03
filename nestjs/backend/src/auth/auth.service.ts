import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { DatabaseService } from '../database/database.service';
import { PublicUser } from '../users/user.types';
import { UsersService } from '../users/users.service';
import {
  AuthResponse,
  ChangePasswordInput,
  ForgotPasswordInput,
  GoogleAuthInput,
  LoginInput,
  PasswordResetTokenRow,
  RefreshTokenInput,
  RefreshTokenRow,
  RegisterInput,
  ResetPasswordInput,
} from './auth.types';

type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  sub?: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly database: DatabaseService,
    private readonly usersService: UsersService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const user = await this.usersService.create(input);
    return this.createAuthResponse(user);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const email = input.email?.trim().toLowerCase();
    const password = input.password;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required.');
    }

    const userWithPassword = await this.usersService.findByEmailWithPassword(email);
    if (!userWithPassword) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(
      password,
      userWithPassword.password_hash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const user = await this.usersService.findById(userWithPassword.id);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.createAuthResponse(user);
  }

  async google(input: GoogleAuthInput): Promise<AuthResponse> {
    const payload = await this.verifyGoogleIdToken(input.idToken);
    const email = payload.email?.trim().toLowerCase();

    if (!email) {
      throw new UnauthorizedException('Google account email is required.');
    }

    const existingUser = await this.usersService.findByEmail(email);
    const user =
      existingUser ??
      (await this.usersService.createGoogleUser({
        email,
        name: payload.name?.trim() || email.split('@')[0],
      }));

    return this.createAuthResponse(user);
  }

  async logout(input: RefreshTokenInput) {
    if (input.refreshToken) {
      await this.revokeRefreshToken(input.refreshToken);
    }

    return { message: 'Logged out.' };
  }

  async refresh(input: RefreshTokenInput): Promise<AuthResponse> {
    if (!input.refreshToken) {
      throw new BadRequestException('Refresh token is required.');
    }

    const tokenHash = this.hashToken(input.refreshToken);
    const [storedToken] = await this.database.query<RefreshTokenRow>(
      `
        SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
        FROM refresh_tokens
        WHERE token_hash = $1
      `,
      [tokenHash],
    );

    if (
      !storedToken ||
      storedToken.revoked_at ||
      storedToken.expires_at.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    await this.database.query(
      `
        UPDATE refresh_tokens
        SET revoked_at = now()
        WHERE id = $1
      `,
      [storedToken.id],
    );

    const user = await this.usersService.findById(storedToken.user_id);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    return this.createAuthResponse(user);
  }

  async forgotPassword(input: ForgotPasswordInput) {
    const email = input.email?.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('Email is required.');
    }

    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      return { message: 'If the email exists, a reset token was created.' };
    }

    const resetToken = this.createRandomToken();
    const resetLink = this.createPasswordResetLink(resetToken);
    await this.database.query(
      `
        INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
        VALUES ($1, $2, $3, now() + interval '30 minutes')
      `,
      [randomUUID(), user.id, this.hashToken(resetToken)],
    );

    const emailSent = await this.sendPasswordResetEmail(user.email, resetLink);

    return {
      message: emailSent
        ? 'If the email exists, a password reset link was sent.'
        : 'Email service is not configured. The reset link was logged in the backend console.',
    };
  }

  async resetPassword(input: ResetPasswordInput) {
    if (!input.token || !input.password || !input.confirmPassword) {
      throw new BadRequestException(
        'Token, password, and confirm password are required.',
      );
    }

    if (input.password !== input.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }

    const tokenHash = this.hashToken(input.token);
    const [storedToken] = await this.database.query<PasswordResetTokenRow>(
      `
        SELECT id, user_id, token_hash, expires_at, used_at, created_at
        FROM password_reset_tokens
        WHERE token_hash = $1
      `,
      [tokenHash],
    );

    if (!storedToken || storedToken.used_at || storedToken.expires_at.getTime() <= Date.now()) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    await this.usersService.updatePassword(storedToken.user_id, input.password);
    await this.database.query(
      `
        UPDATE password_reset_tokens
        SET used_at = now()
        WHERE id = $1
      `,
      [storedToken.id],
    );

    await this.database.query(
      `
        UPDATE refresh_tokens
        SET revoked_at = now()
        WHERE user_id = $1 AND revoked_at IS NULL
      `,
      [storedToken.user_id],
    );

    return { message: 'Password was reset.' };
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    if (!input.currentPassword || !input.newPassword || !input.confirmPassword) {
      throw new BadRequestException(
        'Current password, new password, and confirm password are required.',
      );
    }
    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid access token.');
    }
    const passwordMatches = await bcrypt.compare(
      input.currentPassword,
      user.password_hash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    if (input.newPassword === input.currentPassword) {
      throw new BadRequestException('New password must be different from current password.');
    }

    if (input.newPassword !== input.confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match.');
    }

    await this.usersService.updatePassword(userId, input.newPassword);

    return { message: 'Password changed.' };
  }

  private async createAuthResponse(user: PublicUser): Promise<AuthResponse> {
    const accessToken = this.signAccessToken(user);
    const refreshToken = this.createRandomToken();
    const days = Number(this.config.get<string>('REFRESH_TOKEN_DAYS') ?? 7);

    await this.database.query(
      `
        INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
        VALUES ($1, $2, $3, now() + ($4::int * interval '1 day'))
      `,
      [randomUUID(), user.id, this.hashToken(refreshToken), days],
    );

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  private async revokeRefreshToken(refreshToken: string) {
    await this.database.query(
      `
        UPDATE refresh_tokens
        SET revoked_at = now()
        WHERE token_hash = $1 AND revoked_at IS NULL
      `,
      [this.hashToken(refreshToken)],
    );
  }

  private async revokeRefreshTokensForUser(userId: string) {
    await this.database.query(
      `
        UPDATE refresh_tokens
        SET revoked_at = now()
        WHERE user_id = $1 AND revoked_at IS NULL
      `,
      [userId],
    );
  }

  private async verifyGoogleIdToken(idToken?: string): Promise<GoogleTokenInfo> {
    if (!idToken) {
      throw new BadRequestException('Google ID token is required.');
    }

    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('GOOGLE_CLIENT_ID is required.');
    }

    let payload: GoogleTokenInfo;
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
          idToken,
        )}`,
      );

      if (!response.ok) {
        throw new UnauthorizedException('Invalid Google ID token.');
      }

      payload = (await response.json()) as GoogleTokenInfo;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Unable to verify Google ID token.');
    }

    if (payload.aud !== clientId) {
      throw new UnauthorizedException('Google ID token was issued for another app.');
    }

    if (payload.email_verified !== true && payload.email_verified !== 'true') {
      throw new UnauthorizedException('Google account email is not verified.');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid Google ID token.');
    }

    return payload;
  }

  private createPasswordResetLink(resetToken: string) {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ??
      this.config.get<string>('FRONTEND_ORIGIN')?.split(',')[0]?.trim() ??
      'http://localhost:4200';

    const url = new URL(frontendUrl);
    url.searchParams.set('resetToken', resetToken);
    return url.toString();
  }

  private async sendPasswordResetEmail(email: string, resetLink: string) {
    const resendApiKey = this.config.get<string>('RESEND_API_KEY');
    const from =
      this.config.get<string>('EMAIL_FROM') ?? 'KeepBlog <onboarding@resend.dev>';

    if (!resendApiKey) {
      this.logger.warn(
        `RESEND_API_KEY is not set. Password reset link for ${email}: ${resetLink}`,
      );
      return false;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: 'Reset your KeepBlog password',
        html: `
          <p>Use this link to reset your KeepBlog password:</p>
          <p><a href="${resetLink}">Reset password</a></p>
          <p>This link expires in 30 minutes.</p>
        `,
        text: `Use this link to reset your KeepBlog password: ${resetLink}\n\nThis link expires in 30 minutes.`,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Unable to send password reset email: ${body}`);
      throw new BadRequestException('Unable to send password reset email.');
    }

    return true;
  }

  private signAccessToken(user: PublicUser) {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is required.');
    }

    const expiresIn = (this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ??
      '15m') as jwt.SignOptions['expiresIn'];

    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      secret,
      {
        expiresIn,
      },
    );
  }

  private createRandomToken() {
    return randomBytes(48).toString('base64url');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
