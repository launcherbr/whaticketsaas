import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Contacts", "birthday", {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null,
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Contacts", "birthday");
  },
};


