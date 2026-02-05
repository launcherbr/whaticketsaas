import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
  AutoIncrement,
  AllowNull
} from "sequelize-typescript";
import User from "./User";
import Ticket from "./Ticket";
import Queue from "./Queue";

@Table({
  tableName: 'TicketUsers'
})
class TicketUser extends Model<TicketUser> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Ticket)
  @Column
  ticketId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @AllowNull(true)
  @ForeignKey(() => Queue)
  @Column
  queueId: number | null;

  @BelongsTo(() => Queue)
  queue: Queue;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Ticket)
  ticket: Ticket;

  @BelongsTo(() => User)
  user: User;
}

export default TicketUser;
