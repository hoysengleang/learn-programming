import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { PostEntity } from './entities/post.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { UserEntity } from './entities/user.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [
          UserEntity,
          PostEntity,
          RefreshTokenEntity,
          PasswordResetTokenEntity,
        ],
        synchronize: config.get<string>('TYPEORM_SYNCHRONIZE') !== 'false',
      }),
    }),
  ],
  // Legacy pg version:
  // providers: [DatabaseService],
  // exports: [DatabaseService],
})
export class DatabaseModule {}
