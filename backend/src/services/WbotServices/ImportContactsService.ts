// src/services/ContactServices/ImportContactsService.ts

import * as Sentry from "@sentry/node";
import { isArray, isObject } from "lodash";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Contact from "../../models/Contact";
import { logger } from "../../utils/logger";
import GetWbotContactService from "../BaileysServices/GetWbotContactService"; // <-- MUDANÇA AQUI
import CreateContactService from "./CreateContactService";

const ImportContactsService = async (companyId: number): Promise<void> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);

  let phoneContacts: any[] = []; // Inicializa como array vazio

  try {
    // Busca os contatos diretamente da sessão ativa do wbot
    const contactsObj = await GetWbotContactService(defaultWhatsapp.id); // <-- MUDANÇA AQUI

    // Converte o objeto de contatos em um array
    if (isObject(contactsObj)) {
      phoneContacts = Object.values(contactsObj);
    }
    logger.info(`Found ${phoneContacts.length} contacts to import`);
  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Could not get whatsapp contacts from phone. Err: ${err}`);
    return; // Interrompe a execução se não conseguir buscar os contatos
  }

  if (isArray(phoneContacts) && phoneContacts.length > 0) {
    for (const contact of phoneContacts) {
      const { id, name, notify, pushname } = contact;

      if (!id || id.includes("g.us") || id.includes("status")) {
        continue; // Pula contatos de grupo, status ou sem ID
      }

      const number = id.replace(/\D/g, "");
      const contactName = name || notify || pushname;

      if (!contactName) {
        continue; // Pula contatos sem nenhum nome identificável
      }

      try {
        const existingContact = await Contact.findOne({
          where: { number, companyId },
        });

        if (existingContact) {
          // Apenas atualiza o nome se o novo nome for diferente
          if (existingContact.name !== contactName) {
            existingContact.name = contactName;
            await existingContact.save();
          }
        } else {
          // Cria um novo contato se não existir
          await CreateContactService({
            number,
            name: contactName,
            companyId,
          });
        }
      } catch (error) {
        Sentry.captureException(error);
        logger.warn(`Error processing contact ${number}: ${error}`);
      }
    }
    logger.info("Contact import process finished.");
  } else {
    logger.warn("No contacts found to import.");
  }
};

export default ImportContactsService;
