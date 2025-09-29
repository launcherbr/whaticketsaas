import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Messages");
    if (!(tableDescription as Record<string, any>).isEdited) {
      await queryInterface.addColumn("Messages", "isEdited", {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable("Messages");
    if ((tableDescription as Record<string, any>).isEdited) {
      await queryInterface.removeColumn("Messages", "isEdited");
    }
  }
};
