import { initWASocket, getWbot } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { wbotMessageListener } from "./wbotMessageListener";
import { getIO } from "../../libs/socket";
import wbotMonitor from "./wbotMonitor";
import { logger } from "../../utils/logger";
import * as Sentry from "@sentry/node";

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp,
  companyId: number
): Promise<void> => {
  const whatsappUpdated = await Whatsapp.findOne({
    where: { id: whatsapp.id }
  });

  if (!whatsappUpdated) {
    logger.error(`WhatsApp ${whatsapp.id} não encontrado`);
    return;
  }

  if (whatsappUpdated.status === "CONNECTED") {
    try {
      const wbot = getWbot(whatsapp.id);
      logger.info(`WhatsApp ${whatsapp.name} (ID: ${whatsapp.id}) já está CONNECTED e tem sessão ativa.`);
      const io = getIO();
      io.emit(`company-${companyId}-whatsappSession`, {
        action: "update",
        session: whatsappUpdated
      });
      return;
    } catch (err: any) {
      if (err.message === "ERR_WAPP_NOT_INITIALIZED") {
        logger.warn(`WhatsApp ${whatsapp.name} (ID: ${whatsapp.id}) CONNECTED mas sem sessão na memória. Reinicializando.`);
        await whatsappUpdated.update({ status: "DISCONNECTED" });
      } else {
        logger.error(`Erro ao verificar sessão do WhatsApp ${whatsapp.id}:`, err);
        return;
      }
    }
  }

  await whatsappUpdated.update({ status: "OPENING" });

  const io = getIO();
  io.emit(`company-${companyId}-whatsappSession`, {
    action: "update",
    session: whatsappUpdated
  });

  try {
    const wbot = await initWASocket(whatsappUpdated);

    wbotMessageListener(wbot, companyId);
    await wbotMonitor(wbot, whatsappUpdated, companyId);
  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
  }
};
