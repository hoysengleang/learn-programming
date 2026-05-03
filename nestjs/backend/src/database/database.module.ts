import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseService } from './database.service';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { PostEntity } from './entities/post.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { UserEntity } from './entities/user.entity';

@Global()
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres',
        uri: config.get<string>('DATABASE_URL'),
        models: [
          UserEntity,
          PostEntity,
          RefreshTokenEntity,
          PasswordResetTokenEntity,
        ],
        autoLoadModels: true,
        synchronize: config.get<string>('SEQUELIZE_SYNCHRONIZE') === 'true',
      }),
    }),
  ],
  // Legacy pg version:
  // providers: [DatabaseService],
  // exports: [DatabaseService],
})
export class DatabaseModule {}
