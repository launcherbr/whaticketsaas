import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  AllowNull,
  DataType,
  Default
} from "sequelize-typescript";
import Whatsapp from "./Whatsapp";
import Company from "./Company";

@Table
class HolidayPeriod extends Model<HolidayPeriod> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column(DataType.DATEONLY)
  startDate: Date;

  @Column(DataType.DATEONLY)
  endDate: Date;

  @Column(DataType.TEXT)
  message: string;

  @Default(true)
  @Column
  active: boolean;

  @Default(24)
  @Column
  repeatIntervalHours: number;

  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default HolidayPeriod;

