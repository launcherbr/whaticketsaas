import { QueryInterface, QueryTypes } from "sequelize";

const INSERT_SETTING = `INSERT INTO "Settings" ("key", "value", "companyId", "createdAt", "updatedAt")
VALUES (:key, :value, :companyId, NOW(), NOW());`;

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const companies = await queryInterface.sequelize.query<{ id: number }>('SELECT id FROM "Companies"', {
      type: QueryTypes.SELECT
    });

    const templateTransfer =
      "{{ms}} {{name}}, seu atendimento foi transferido. Departamento: {{queue}}. Atendente: {{agent}}.";
    const templateGreeting =
      "{{ms}} {{name}}, meu nome é {{agent}} e vou prosseguir com seu atendimento!";

    for (const company of companies) {
      const settingsToEnsure = [
        {
          key: "sendMsgTransfTicketMessage",
          value: templateTransfer
        },
        {
          key: "sendGreetingAcceptedMessage",
          value: templateGreeting
        }
      ];

      for (const setting of settingsToEnsure) {
        const existingSettings = await queryInterface.sequelize.query<{ id: number }>(
          'SELECT id FROM "Settings" WHERE "key" = :key AND "companyId" = :companyId',
          {
            type: QueryTypes.SELECT,
            replacements: {
              key: setting.key,
              companyId: company.id
            }
          }
        );

        if (existingSettings.length === 0) {
          await queryInterface.sequelize.query(INSERT_SETTING, {
            replacements: {
              key: setting.key,
              value: setting.value,
              companyId: company.id
            }
          });
        }
      }
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("Settings", {
      key: ["sendMsgTransfTicketMessage", "sendGreetingAcceptedMessage"]
    });
  }
};
