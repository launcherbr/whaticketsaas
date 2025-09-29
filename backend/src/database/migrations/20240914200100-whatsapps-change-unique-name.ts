import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    try {
      // Remover a constraint existente, se necessário
      await queryInterface.removeConstraint("Whatsapps", "Whatsapps_name_key");
    } catch (e) {
      // No operation if the constraint does not exist
    }

    // Adicionar uma nova constraint única usando array de campos e objeto separado
    return queryInterface.addConstraint("Whatsapps", ["companyId", "name"], {
      type: "unique",
      name: "company_name_constraint"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      // Adicionar a constraint única de volta
      await queryInterface.addConstraint("Whatsapps", ["name"], {
        type: "unique",
        name: "Whatsapps_name_key"
      });
    } catch (e) {
      // No operation if the constraint already exists
    }

    // Remover a constraint adicionada no método `up`
    return queryInterface.removeConstraint("Whatsapps", "company_name_constraint");
  }
};
