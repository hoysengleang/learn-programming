import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { CreatePostInput, PostRow, PublicPost, UpdatePostInput } from './post.types';

const ALLOWED_COLORS = new Set([
  '#fff8c5',
  '#d7f7c2',
  '#d7efff',
  '#ffe0e6',
  '#eadcff',
  '#f1f3f4',
]);

@Injectable()
export class PostsService {
  constructor(private readonly database: DatabaseService) {}

  async findAll(userId: string): Promise<PublicPost[]> {
    const rows = await this.database.query<PostRow>(
      `
        SELECT id, user_id, title, content, tag, color, is_pinned, created_at, updated_at
        FROM posts
        WHERE user_id = $1
        ORDER BY is_pinned DESC, updated_at DESC
      `,
      [userId],
    );

    return rows.map((row) => this.toPublicPost(row));
  }

  async create(userId: string, input: CreatePostInput): Promise<PublicPost> {
    const title = input.title?.trim();
    const content = input.content?.trim();

    if (!title || !content) {
      throw new BadRequestException('Title and content are required.');
    }

    const [post] = await this.database.query<PostRow>(
      `
        INSERT INTO posts (id, user_id, title, content, tag, color, is_pinned)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, user_id, title, content, tag, color, is_pinned, created_at, updated_at
      `,
      [
        randomUUID(),
        userId,
        title,
        content,
        this.cleanTag(input.tag),
        this.cleanColor(input.color),
        input.isPinned ?? false,
      ],
    );

    return this.toPublicPost(post);
  }

  async update(
    userId: string,
    postId: string,
    input: UpdatePostInput,
  ): Promise<PublicPost> {
    await this.ensureOwner(userId, postId);

    const current = await this.findOne(postId);
    const title = input.title === undefined ? current.title : input.title.trim();
    const content =
      input.content === undefined ? current.content : input.content.trim();

    if (!title || !content) {
      throw new BadRequestException('Title and content cannot be empty.');
    }

    const [post] = await this.database.query<PostRow>(
      `
        UPDATE posts
        SET title = $1,
            content = $2,
            tag = $3,
            color = $4,
            is_pinned = $5,
            updated_at = now()
        WHERE id = $6
        RETURNING id, user_id, title, content, tag, color, is_pinned, created_at, updated_at
      `,
      [
        title,
        content,
        this.cleanTag(input.tag ?? current.tag),
        this.cleanColor(input.color ?? current.color),
        input.isPinned ?? current.isPinned,
        postId,
      ],
    );

    return this.toPublicPost(post);
  }

  async remove(userId: string, postId: string) {
    await this.ensureOwner(userId, postId);

    await this.database.query('DELETE FROM posts WHERE id = $1', [postId]);
    return { message: 'Post deleted.' };
  }

  private async ensureOwner(userId: string, postId: string): Promise<void> {
    const post = await this.findOne(postId);

    if (post.userId !== userId) {
      throw new ForbiddenException('You cannot change this post.');
    }
  }

  private async findOne(postId: string): Promise<PublicPost> {
    const [post] = await this.database.query<PostRow>(
      `
        SELECT id, user_id, title, content, tag, color, is_pinned, created_at, updated_at
        FROM posts
        WHERE id = $1
      `,
      [postId],
    );

    if (!post) {
      throw new NotFoundException('Post was not found.');
    }

    return this.toPublicPost(post);
  }

  private cleanTag(tag?: string): string {
    const clean = tag?.trim();
    return clean || 'General';
  }

  private cleanColor(color?: string): string {
    return color && ALLOWED_COLORS.has(color) ? color : '#fff8c5';
  }

  private toPublicPost(row: PostRow): PublicPost {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      tag: row.tag,
      color: row.color,
      isPinned: row.is_pinned,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
