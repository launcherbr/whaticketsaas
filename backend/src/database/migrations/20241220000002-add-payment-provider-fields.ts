import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Invoices", "paymentProvider", {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn("Invoices", "providerPaymentId", {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn("Invoices", "pixCopyPaste", {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn("Invoices", "qrCodeBase64", {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn("Invoices", "payerEmail", {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn("Subscriptions", "paymentProvider", {
      type: DataTypes.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Invoices", "paymentProvider");
    await queryInterface.removeColumn("Invoices", "providerPaymentId");
    await queryInterface.removeColumn("Invoices", "pixCopyPaste");
    await queryInterface.removeColumn("Invoices", "qrCodeBase64");
    await queryInterface.removeColumn("Invoices", "payerEmail");
    await queryInterface.removeColumn("Subscriptions", "paymentProvider");
  }
};

