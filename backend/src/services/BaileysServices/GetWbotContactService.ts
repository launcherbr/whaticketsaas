import { Contact as BaileysContact } from "baileys";
import { getWbot } from "../../libs/wbot";
import AppError from "../../errors/AppError";

const GetWbotContactService = async (
  whatsappId: number
): Promise<{ [id: string]: BaileysContact }> => {
  const wbot = getWbot(whatsappId);

  if (!wbot.contacts) {
    throw new AppError("ERR_WAPP_CONTACTS_NOT_FOUND", 404);
  }

  return wbot.contacts;
};

export default GetWbotContactService;
