import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import { logger } from "../../utils/logger";

interface IOnWhatsapp {
  jid: string;
  exists: boolean;
}

const checker = async (number: string, wbot: any) => {
  const cleanNumber = `${number}`.replace(/\D/g, "").slice(0, 15);
  if (!cleanNumber) {
    throw new Error("ERR_INVALID_NUMBER");
  }

  const [validNumber] = await wbot.onWhatsApp(`${cleanNumber}@s.whatsapp.net`);

  logger.info(validNumber);

  return validNumber;
};

const CheckContactNumber = async (
  number: string,
  companyId: number
): Promise<IOnWhatsapp> => {
  const cleanNumber = `${number}`.replace(/\D/g, "").slice(0, 15);
  if (!cleanNumber) {
    throw new Error("ERR_INVALID_NUMBER");
  }

  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);

  const wbot = getWbot(defaultWhatsapp.id);
  const isNumberExit = await checker(cleanNumber, wbot);

  if (!isNumberExit.exists) {
    throw new Error("ERR_CHECK_NUMBER");
  }
  return isNumberExit;
};

export default CheckContactNumber;
