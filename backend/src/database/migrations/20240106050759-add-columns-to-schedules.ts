import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Schedules", "repeatEvery", {
        type: DataTypes.TEXT,
        defaultValue: null,
        allowNull: true
      }),
      queryInterface.addColumn("Schedules", "repeatCount", {
        type: DataTypes.TEXT,
        defaultValue: null,
        allowNull: true
      }),
      queryInterface.addColumn("Schedules", "selectDaysRecorrenci", {
        type: DataTypes.STRING,
        defaultValue: null,
        allowNull: true
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Schedules", "repeatEvery"),
      queryInterface.removeColumn("Schedules", "repeatCount"),
      queryInterface.removeColumn("Schedules", "selectDaysRecorrenci")
    ]);
  }
};
