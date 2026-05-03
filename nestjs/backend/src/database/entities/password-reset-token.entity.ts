import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { UserEntity } from './user.entity';

@Table({ tableName: 'password_reset_tokens', timestamps: false })
export class PasswordResetTokenEntity extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare id: string;

  @ForeignKey(() => UserEntity)
  @Column({ type: DataType.UUID, allowNull: false })
  declare user_id: string;

  @BelongsTo(() => UserEntity, { foreignKey: 'user_id', onDelete: 'CASCADE' })
  declare user?: UserEntity;

  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  declare token_hash: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare expires_at: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  declare used_at: Date | null;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare created_at: Date;
}
