import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Verificar se a constraint existe antes de tentar removê-la
    try {
      await queryInterface.removeConstraint("Tickets", "contactid_companyid_unique");
    } catch (error: any) {
      // Se a constraint não existir, apenas logar e continuar
      if (error.name !== 'SequelizeUnknownConstraintError' && !error.message?.includes('não existe')) {
        console.log('Constraint não encontrada ou já removida, continuando...');
      }
    }
    
    // Adicionar a nova constraint com whatsappId
    return queryInterface.addConstraint("Tickets", ["contactId", "companyId", "whatsappId"], {
      type: "unique",
      name: "contactid_companyid_unique"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    // Verificar se a constraint existe antes de tentar removê-la
    try {
      return await queryInterface.removeConstraint(
        "Tickets",
        "contactid_companyid_unique"
      );
    } catch (error: any) {
      // Se a constraint não existir, apenas logar
      if (error.name !== 'SequelizeUnknownConstraintError' && !error.message?.includes('não existe')) {
        console.log('Constraint não encontrada, pulando remoção...');
      }
    }
  }
};
