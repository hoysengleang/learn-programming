import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { JwtAuthMiddleware } from './auth/jwt-auth.middleware';
import { DatabaseModule } from './database/database.module';
import { PostsController } from './posts/posts.controller';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    PostsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware).forRoutes(
      PostsController,
      {
        path: 'auth/change-password',
        method: RequestMethod.POST,
      },
    );
  }
}
