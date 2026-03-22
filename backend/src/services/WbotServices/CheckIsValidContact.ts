import AppError from "../../errors/AppError";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";

const CheckIsValidContact = async (
  number: string,
  companyId: number
): Promise<void> => {
  const cleanNumber = `${number}`.replace(/\D/g, "").slice(0, 15);
  if (!cleanNumber) {
    throw new AppError("ERR_WAPP_INVALID_CONTACT", 400);
  }

  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);

  const wbot = getWbot(defaultWhatsapp.id);

  try {
    const isValidNumber = await wbot.onWhatsApp(`${cleanNumber}`);
    if (!isValidNumber) {
      throw new AppError("invalidNumber");
    }
  } catch (err: any) {
    if (err.message === "invalidNumber") {
      throw new AppError("ERR_WAPP_INVALID_CONTACT");
    }
    throw new AppError("ERR_WAPP_CHECK_CONTACT");
  }
};

export default CheckIsValidContact;
