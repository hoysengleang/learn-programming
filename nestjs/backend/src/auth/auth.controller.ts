import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthUser } from './auth-user';
import { CurrentUser } from './auth-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  ChangePasswordInput,
  ForgotPasswordInput,
  GoogleAuthInput,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
} from './auth.types';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterInput) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: LoginInput) {
    return this.authService.login(body);
  }

  @Post('google')
  google(@Body() body: GoogleAuthInput) {
    return this.authService.google(body);
  }

  @Post('logout')
  logout(@Body() body: RefreshTokenInput) {
    return this.authService.logout(body);
  }

  @Post('refresh')
  refresh(@Body() body: RefreshTokenInput) {
    return this.authService.refresh(body);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordInput) {
    return this.authService.forgotPassword(body);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordInput) {
    return this.authService.resetPassword(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() body: ChangePasswordInput,
  ) {
    return this.authService.changePassword(user.id, body);
  }
}
