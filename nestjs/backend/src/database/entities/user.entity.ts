import {
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { PasswordResetTokenEntity } from './password-reset-token.entity';
import { PostEntity } from './post.entity';
import { RefreshTokenEntity } from './refresh-token.entity';

@Table({ tableName: 'users', timestamps: false })
export class UserEntity extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare id: string;

  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare password_hash: string;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare created_at: Date;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare updated_at: Date;

  @HasMany(() => PostEntity)
  declare posts?: PostEntity[];

  @HasMany(() => RefreshTokenEntity)
  declare refresh_tokens?: RefreshTokenEntity[];

  @HasMany(() => PasswordResetTokenEntity)
  declare password_reset_tokens?: PasswordResetTokenEntity[];
}
