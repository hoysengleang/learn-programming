import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/auth-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePostInput, UpdatePostInput } from './post.types';
import { PostsService } from './posts.service';

@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.postsService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreatePostInput) {
    return this.postsService.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdatePostInput,
  ) {
    return this.postsService.update(user.id, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.postsService.remove(user.id, id);
  }
}
