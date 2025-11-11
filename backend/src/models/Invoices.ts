import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  HasMany,
  Unique
} from "sequelize-typescript";

@Table({ tableName: "Invoices" })
class Invoices extends Model<Invoices> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  detail: string;

  @Column
  status: string;

  @Column
  value: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Column
  dueDate: string;

  @Column
  companyId: number;

  @Column
  paymentProvider: string;

  @Column
  providerPaymentId: string;

  @Column
  pixCopyPaste: string;

  @Column
  qrCodeBase64: string;

  @Column
  payerEmail: string;

}

export default Invoices;
