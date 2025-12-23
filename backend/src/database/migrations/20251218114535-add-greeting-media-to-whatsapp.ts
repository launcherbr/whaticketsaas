import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Whatsapps", "greetingMediaPath", {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("Whatsapps", "greetingMediaName", {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("Whatsapps", "greetingMediaSendMode", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "caption"
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Whatsapps", "greetingMediaPath"),
      queryInterface.removeColumn("Whatsapps", "greetingMediaName"),
      queryInterface.removeColumn("Whatsapps", "greetingMediaSendMode")
    ]);
  }
};


