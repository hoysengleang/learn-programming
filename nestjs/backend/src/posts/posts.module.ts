import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PostEntity } from '../database/entities/post.entity';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [SequelizeModule.forFeature([PostEntity])],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
