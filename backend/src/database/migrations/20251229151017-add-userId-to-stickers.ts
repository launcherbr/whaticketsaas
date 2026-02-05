import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    // Verificar se a coluna userId já existe antes de adicionar
    return queryInterface.describeTable("Stickers").then((tableDescription: any) => {
      if (!tableDescription.userId) {
        return queryInterface.addColumn("Stickers", "userId", {
          type: DataTypes.INTEGER,
          references: { model: "Users", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          allowNull: true
        });
      }
      return Promise.resolve();
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Stickers", "userId");
  }
};
