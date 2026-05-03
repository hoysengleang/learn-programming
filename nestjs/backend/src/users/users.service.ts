import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { UserEntity } from '../database/entities/user.entity';
import { CreateUserInput, PublicUser, UserRow } from './user.types';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserEntity)
    private readonly usersModel: typeof UserEntity,
  ) {}

  async findAll(): Promise<PublicUser[]> {
    // Legacy pg version:
    // const rows = await this.database.query<UserRow>(`
    //   SELECT id, email, name, password_hash, created_at, updated_at
    //   FROM users
    //   ORDER BY created_at DESC
    // `);
    const rows = await this.usersModel.findAll({
      order: [['created_at', 'DESC']],
    });

    return rows.map((row) => this.toPublicUser(row));
  }

  async create(input: CreateUserInput): Promise<PublicUser> {
    const name = input.name?.trim();
    const email = input.email?.trim().toLowerCase();
    const password = input.password;

    if (!name || !email || !password) {
      throw new BadRequestException('Name, email, and password are required.');
    }

    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      // Legacy pg version:
      // const [user] = await this.database.query<UserRow>(
      //   `
      //     INSERT INTO users (id, email, name, password_hash)
      //     VALUES ($1, $2, $3, $4)
      //     RETURNING id, email, name, password_hash, created_at, updated_at
      //   `,
      //   [randomUUID(), email, name, passwordHash],
      // );
      const user = await this.usersModel.create({
        id: randomUUID(),
        email,
        name,
        password_hash: passwordHash,
      });

      return this.toPublicUser(user);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Email is already registered.');
      }

      throw error;
    }
  }

  async findByEmailWithPassword(email: string): Promise<UserRow | null> {
    // Legacy pg version:
    // const [user] = await this.database.query<UserRow>(
    //   `
    //     SELECT id, email, name, password_hash, created_at, updated_at
    //     FROM users
    //     WHERE email = $1
    //   `,
    //   [email.trim().toLowerCase()],
    // );
    const user = await this.usersModel.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    return user ?? null;
  }

  async findByIdWithPassword(id: string): Promise<UserRow | null> {
    // Legacy pg version:
    // const [user] = await this.database.query<UserRow>(
    //   `
    //     SELECT id, email, name, password_hash, created_at, updated_at
    //     FROM users
    //     WHERE id = $1
    //   `,
    //   [id],
    // );
    const user = await this.usersModel.findOne({ where: { id } });

    return user ?? null;
  }

  async findByEmail(email: string): Promise<PublicUser | null> {
    const user = await this.findByEmailWithPassword(email);
    return user ? this.toPublicUser(user) : null;
  }

  async findById(id: string): Promise<PublicUser | null> {
    // Legacy pg version:
    // const [user] = await this.database.query<UserRow>(
    //   `
    //     SELECT id, email, name, password_hash, created_at, updated_at
    //     FROM users
    //     WHERE id = $1
    //   `,
    //   [id],
    // );
    const user = await this.usersModel.findOne({ where: { id } });

    return user ? this.toPublicUser(user) : null;
  }

  async updatePassword(userId: string, password: string): Promise<void> {
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Legacy pg version:
    // await this.database.query(
    //   `
    //     UPDATE users
    //     SET password_hash = $1, updated_at = now()
    //     WHERE id = $2
    //   `,
    //   [passwordHash, userId],
    // );
    await this.usersModel.update(
      { password_hash: passwordHash, updated_at: new Date() },
      { where: { id: userId } },
    );
  }

  async createGoogleUser(input: { email: string; name: string }): Promise<PublicUser> {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim() || email.split('@')[0];
    const passwordHash = await bcrypt.hash(randomUUID(), 10);

    try {
      // Legacy pg version:
      // const [user] = await this.database.query<UserRow>(
      //   `
      //     INSERT INTO users (id, email, name, password_hash)
      //     VALUES ($1, $2, $3, $4)
      //     RETURNING id, email, name, password_hash, created_at, updated_at
      //   `,
      //   [randomUUID(), email, name, passwordHash],
      // );
      const user = await this.usersModel.create({
        id: randomUUID(),
        email,
        name,
        password_hash: passwordHash,
      });

      return this.toPublicUser(user);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
          return existingUser;
        }
      }

      throw error;
    }
  }

  private toPublicUser(row: UserRow): PublicUser {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      (('code' in error && error.code === '23505') ||
        ('name' in error && error.name === 'SequelizeUniqueConstraintError'))
    );
  }
}
