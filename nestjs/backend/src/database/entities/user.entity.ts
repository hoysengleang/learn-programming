import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PasswordResetTokenEntity } from './password-reset-token.entity';
import { PostEntity } from './post.entity';
import { RefreshTokenEntity } from './refresh-token.entity';

@Entity('users')
export class UserEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true })
  email!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  password_hash!: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updated_at!: Date;

  @OneToMany(() => PostEntity, (post) => post.user)
  posts?: PostEntity[];

  @OneToMany(() => RefreshTokenEntity, (token) => token.user)
  refresh_tokens?: RefreshTokenEntity[];

  @OneToMany(() => PasswordResetTokenEntity, (token) => token.user)
  password_reset_tokens?: PasswordResetTokenEntity[];
}
