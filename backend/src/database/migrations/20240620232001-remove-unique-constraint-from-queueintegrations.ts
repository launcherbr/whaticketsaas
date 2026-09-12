import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.removeConstraint("QueueIntegrations", "QueueIntegrations_name_key");
    await queryInterface.removeConstraint("QueueIntegrations", "QueueIntegrations_projectName_key");
    await queryInterface.removeIndex("QueueIntegrations", "QueueIntegrations_name_key");
    await queryInterface.removeIndex("QueueIntegrations", "QueueIntegrations_projectName_key");
  },

  down: async (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addConstraint("QueueIntegrations", {
        fields: ["name"],
        name: "QueueIntegrations_name_key",
        type: 'unique'
      }),
      queryInterface.addConstraint("QueueIntegrations", {
        fields: ["projectName"],
        name: "QueueIntegrations_projectName_key",
        type: 'unique'
      }),
    ]);

  }
};