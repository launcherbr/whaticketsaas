import * as Sentry from "@sentry/node";
import { isArray, isObject } from "lodash";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Contact from "../../models/Contact";
import { logger } from "../../utils/logger";
import GetWbotContactService from "../BaileysServices/GetWbotContactService";
import CreateContactService from "../ContactServices/CreateContactService";

const ImportContactsService = async (companyId: number): Promise<void> => {
  logger.info("==============================================");
  logger.info("INICIANDO SERVIÇO DE IMPORTAÇÃO DE CONTATOS");

  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
  logger.info(`Usando WhatsApp padrão: ID ${defaultWhatsapp.id}`);

  let phoneContacts: any[] = [];

  try {
    logger.info("Passo 1: Buscando contatos da sessão ativa do wbot...");
    const contactsObj = await GetWbotContactService(defaultWhatsapp.id);

    // LOG CRÍTICO: Vamos ver os dados brutos que recebemos
    logger.info({ rawContacts: contactsObj }, "Dados brutos recebidos do GetWbotContactService.");

    if (isObject(contactsObj)) {
      const numberOfContactsInObject = Object.keys(contactsObj).length;
      logger.info(`Passo 2: ${numberOfContactsInObject} contatos encontrados no objeto. Convertendo para array...`);
      phoneContacts = Object.values(contactsObj);
    } else {
      logger.warn("AVISO: O serviço não retornou um objeto de contatos válido.");
    }
    
    logger.info(`Passo 3: Conversão concluída. Total de contatos no array: ${phoneContacts.length}`);

  } catch (err) {
    Sentry.captureException(err);
    logger.error({ err }, "ERRO CRÍTICO ao buscar contatos da sessão wbot.");
    logger.info("SERVIÇO DE IMPORTAÇÃO INTERROMPIDO DEVIDO A ERRO.");
    logger.info("==============================================");
    return;
  }

  if (isArray(phoneContacts) && phoneContacts.length > 0) {
    logger.info("Passo 4: Iniciando processamento do loop de contatos...");
    let importedCount = 0;
    let skippedCount = 0;

    for (const contact of phoneContacts) {
      const { id, name, notify, pushname } = contact;

      if (!id || id.includes("g.us") || id.includes("status")) {
        // logger.info(`- Contato ${id || 'sem ID'} pulado (é grupo, status ou sem ID).`);
        skippedCount++;
        continue;
      }

      const number = id.replace(/\D/g, "");
      const contactName = name || notify || pushname;

      if (!contactName) {
        // logger.info(`- Contato ${number} pulado (não tem nome identificável).`);
        skippedCount++;
        continue;
      }

      // Se passou pelos filtros, processa
      try {
        const existingContact = await Contact.findOne({ where: { number, companyId } });

        if (existingContact) {
          if (existingContact.name !== contactName) {
            await existingContact.update({ name: contactName });
            // logger.info(`> Contato ${number} atualizado com novo nome: ${contactName}`);
          }
        } else {
          await CreateContactService({ number, name: contactName, companyId });
          // logger.info(`> Contato ${number} (${contactName}) criado com sucesso.`);
        }
        importedCount++;
      } catch (error) {
        Sentry.captureException(error);
        logger.warn(`Erro ao processar o contato ${number}: ${error}`);
      }
    }
    logger.info(`Passo 5: Processamento do loop concluído.`);
    logger.info(`Resultado: ${importedCount} contatos processados (criados/atualizados).`);
    logger.info(`Resultado: ${skippedCount} contatos pulados (grupos, status, etc).`);

  } else {
    logger.warn("AVISO: Nenhum contato encontrado para processar após a conversão.");
  }

  logger.info("SERVIÇO DE IMPORTAÇÃO DE CONTATOS FINALIZADO.");
  logger.info("==============================================");
};

export default ImportContactsService;
