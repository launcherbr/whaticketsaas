import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Contacts", "lid", {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "LID (Local ID) do contato para identificação única"
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Contacts", "lid");
  }
};
