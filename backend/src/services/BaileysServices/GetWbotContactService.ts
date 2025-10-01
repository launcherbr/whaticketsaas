import { Contact as BaileysContact } from "baileys";
import { getWbot } from "../../libs/wbot";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger"; // Importar o logger

const GetWbotContactService = async (
  whatsappId: number
): Promise<{ [id: string]: BaileysContact }> => {
  const wbot = getWbot(whatsappId);

  // LOG DE DIAGNÓSTICO: VAMOS VER TODAS AS CHAVES DO OBJETO WBOT
  logger.info("=================================================");
  logger.info("INSPECIONANDO O OBJETO WBOT...");
  logger.info({ keys: Object.keys(wbot) }, "Propriedades encontradas no objeto wbot:");
  logger.info("=================================================");


  if (!wbot.contacts) {
    throw new AppError("ERR_WAPP_CONTACTS_NOT_FOUND", 404);
  }

  return wbot.contacts;
};

export default GetWbotContactService;
