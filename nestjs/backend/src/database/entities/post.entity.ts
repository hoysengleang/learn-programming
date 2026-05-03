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

@Table({ tableName: 'posts', timestamps: false })
export class PostEntity extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare id: string;

  @ForeignKey(() => UserEntity)
  @Column({ type: DataType.UUID, allowNull: false })
  declare user_id: string;

  @BelongsTo(() => UserEntity, { foreignKey: 'user_id', onDelete: 'CASCADE' })
  declare user?: UserEntity;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare content: string;

  @Column({ type: DataType.TEXT, allowNull: false, defaultValue: 'General' })
  declare tag: string;

  @Column({ type: DataType.TEXT, allowNull: false, defaultValue: '#fff8c5' })
  declare color: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare is_pinned: boolean;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare created_at: Date;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare updated_at: Date;
}
