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

  let phoneContacts;

  try {
    const contactsString = await ShowBaileysService(wbot.id);
    phoneContacts = JSON.parse(JSON.stringify(contactsString.contacts));

    const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
    const companyFolder = path.join(publicFolder, `company${companyId}`);
    
    try {
      await mkdirAsync(companyFolder, { recursive: true });
    } catch (err) {
      logger.error(`Failed to create company folder: ${err}`);
      throw err;
    }

    const beforeFilePath = path.join(companyFolder, 'contatos_antes.txt');
    await writeFileAsync(beforeFilePath, JSON.stringify(phoneContacts, null, 2));
    console.log(`O arquivo contatos_antes.txt foi criado na pasta company${companyId}!`);

  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Could not get whatsapp contacts from phone. Err: ${err}`);
  }

  const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
  const companyFolder = path.join(publicFolder, `company${companyId}`);
  const afterFilePath = path.join(companyFolder, 'contatos_depois.txt');
  
  try {
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
      
      // CORREÇÃO: Substituir o slice(0, 12) pela lógica inteligente
      let number = id.replace(/\D/g, "");

      if (number.length === 13 && number.startsWith("55")) {
        const ddd = parseInt(number.substring(2, 4));
        const ninthDigit = number[4];
        const nextDigit = parseInt(number[5]);

        const dddsNonoDigitoObrigatorio = [
          11, 12, 13, 14, 15, 16, 17, 18, 19,
          21, 22, 24,
          27, 28
        ];

        if (dddsNonoDigitoObrigatorio.includes(ddd)) {
          // Mantém 13 dígitos para DDDs VIP (SP, RJ, ES)
        } else {
          // Para outros DDDs
          if (ninthDigit === "9") {
             // Se o próximo dígito for 7, 8 ou 9, remove o 9 extra (faixa antiga)
             if (nextDigit >= 7) {
               number = number.slice(0, 4) + number.slice(5);
             }
             // Se for < 7 (ex: 34 9 3...), mantém os 13 dígitos
          } else {
             number = number.slice(0, 12);
          }
        }
      } else {
        // Padrão de segurança para números não-BR ou formatos estranhos
        number = number.slice(0, 12);
      }

      const existingContact = await Contact.findOne({
        where: { number, companyId }
      });

      if (existingContact) {
        existingContact.name = name || notify;
        await existingContact.save();
      } else {
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
