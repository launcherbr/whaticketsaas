import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("HolidayPeriods", "repeatIntervalHours", {
      type: DataTypes.INTEGER,
      defaultValue: 24,
      allowNull: false,
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("HolidayPeriods", "repeatIntervalHours");
  },
};


