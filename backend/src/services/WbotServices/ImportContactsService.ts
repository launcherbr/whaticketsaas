import * as Sentry from "@sentry/node";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import { logger } from "../../utils/logger";
import ShowBaileysService from "../BaileysServices/ShowBaileysService";
import CreateContactService from "../ContactServices/CreateContactService";
import { isString, isArray } from "lodash";
import path from "path";
import fs from 'fs';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

const ImportContactsService = async (companyId: number): Promise<void> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
  const wbot = getWbot(defaultWhatsapp.id);

  let phoneContacts: any; // Declarada aqui para ser acessível em todo o escopo da função

  try {
    const contactsString = await ShowBaileysService(wbot.id);
    // Atribui o valor à variável do escopo superior, em vez de criar uma nova
    phoneContacts = JSON.parse(JSON.stringify(contactsString.contacts));

    const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
    const companyFolder = path.join(publicFolder, `company${companyId}`);
    
    // Create company folder if it doesn't exist
    try {
      await mkdirAsync(companyFolder, { recursive: true });
    } catch (err) {
      logger.error(`Failed to create company folder: ${err}`);
      throw err;
    }

    const beforeFilePath = path.join(companyFolder, 'contatos_antes.txt');
    // Garante que phoneContacts não seja undefined antes de escrever
    if (phoneContacts) {
      await writeFileAsync(beforeFilePath, JSON.stringify(phoneContacts, null, 2));
      console.log(`O arquivo contatos_antes.txt foi criado na pasta company${companyId}!`);
    }

  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Could not get whatsapp contacts from phone. Err: ${err}`);
  }

  // Verifica se phoneContacts tem dados antes de prosseguir
  if (!phoneContacts) {
    logger.error("phoneContacts is undefined, skipping remaining processing.");
    return;
  }
  
  const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
  const companyFolder = path.join(publicFolder, `company${companyId}`);
  const afterFilePath = path.join(companyFolder, 'contatos_depois.txt');
  
  try {
    // Agora a variável phoneContacts está acessível aqui com o valor correto
    await writeFileAsync(afterFilePath, JSON.stringify(phoneContacts, null, 2));
  } catch (err) {
    logger.error(`Failed to write contacts to file: ${err}`);
    throw err;
  }

  const phoneContactsList = isString(phoneContacts)
    ? JSON.parse(phoneContacts)
    : phoneContacts;

  if (isArray(phoneContactsList)) {
    phoneContactsList.forEach(async ({ id, name, notify }) => {
      if (id === "status@broadcast" || id.includes("g.us")) return;
      const number = id.replace(/\D/g, "");

      const existingContact = await Contact.findOne({
        where: { number, companyId }
      });

      if (existingContact) {
        // Atualiza o nome do contato existente
        existingContact.name = name || notify;
        await existingContact.save();
      } else {
        // Criar um novo contato
        try {
          await CreateContactService({
            number,
            name: name || notify,
            companyId
          });
        } catch (error) {
          Sentry.captureException(error);
          logger.warn(
            `Could not get whatsapp contacts from phone. Err: ${error}`
          );
        }
      }
    });
  }
};

export default ImportContactsService;
