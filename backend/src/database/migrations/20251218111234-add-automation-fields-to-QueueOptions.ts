import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("QueueOptions", "queueType", {
        type: DataTypes.STRING,
        defaultValue: null,
        allowNull: true
      }),
      queryInterface.addColumn("QueueOptions", "queueOptionsId", {
        type: DataTypes.INTEGER,
        defaultValue: null,
        allowNull: true,
        references: { model: "Queues", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      }),
      queryInterface.addColumn("QueueOptions", "queueUsersId", {
        type: DataTypes.INTEGER,
        defaultValue: null,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("QueueOptions", "queueType"),
      queryInterface.removeColumn("QueueOptions", "queueOptionsId"),
      queryInterface.removeColumn("QueueOptions", "queueUsersId")
    ]);
  }
};


