import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PasswordResetTokenEntity } from '../database/entities/password-reset-token.entity';
import { RefreshTokenEntity } from '../database/entities/refresh-token.entity';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    SequelizeModule.forFeature([RefreshTokenEntity, PasswordResetTokenEntity]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
