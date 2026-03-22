import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import { logger } from "../../utils/logger";
import ShowBaileysService from "../BaileysServices/ShowBaileysService";
import CreateContactService from "../ContactServices/CreateContactService";
import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";

const ImportContactsService = async (
  companyId: number,
  whatsappId?: number
): Promise<void> => {
  // Define qual conexão WhatsApp usar:
  // - Se vier whatsappId no corpo da requisição, usa essa conexão
  // - Caso contrário, usa o WhatsApp padrão da empresa (comportamento anterior)
  let targetWhatsappId = whatsappId;

  if (!targetWhatsappId) {
    const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
    targetWhatsappId = defaultWhatsapp.id;
  }

  const whatsapp = await Whatsapp.findOne({
    where: {
      id: targetWhatsappId,
      companyId,
      status: "CONNECTED"
    }
  });

  if (!whatsapp) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  const wbot = getWbot(whatsapp.id);

  const baileys = await ShowBaileysService(wbot.id);

  let phoneContactsList: any[] = [];

  try {
    const parsed = baileys.contacts && JSON.parse(baileys.contacts as any);

    // Normaliza o formato vindo do Baileys para sempre ter um array de contatos,
    // independente se vem como array, objeto ou aninhado em "contacts".
    if (Array.isArray(parsed)) {
      phoneContactsList = parsed;
    } else if (parsed && typeof parsed === "object") {
      if (Array.isArray((parsed as any).contacts)) {
        phoneContactsList = (parsed as any).contacts;
      } else {
        phoneContactsList = Object.values(parsed as any);
      }
    }
  } catch (error) {
    logger.warn(
      { baileys },
      `Could not get whatsapp contacts from database. Err: ${error}`
    );
    throw new AppError("Could not get whatsapp contacts from database.", 500);
  }

  if (Array.isArray(phoneContactsList) && phoneContactsList.length) {
    for (const { id, name, notify } of phoneContactsList) {
      if (id === "status@broadcast" || id.includes("g.us")) continue;

      // Suporta números de qualquer país (até 15 dígitos conforme padrão internacional)
      const number = id.replace(/\D/g, "").slice(0, 15);

      const existingContact = await Contact.findOne({
        where: { number, companyId }
      });

      if (existingContact) {
        existingContact.name = name || notify || number;
        await existingContact.save();
      } else {
        try {
          await CreateContactService({
            number,
            name: name || notify || number,
            companyId
          });
        } catch (error) {
          logger.error(
            { name, number, companyId },
            `Could not save contact. Err: ${error}`
          );
        }
      }
    }
  }
};

export default ImportContactsService;