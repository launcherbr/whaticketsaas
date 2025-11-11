import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Announcements", "showForSuperAdmin", {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }),
      queryInterface.addColumn("Announcements", "sendToAllCompanies", {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Announcements", "showForSuperAdmin"),
      queryInterface.removeColumn("Announcements", "sendToAllCompanies")
    ]);
  }
};


