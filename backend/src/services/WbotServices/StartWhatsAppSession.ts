import { initWASocket, getWbot } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { wbotMessageListener } from "./wbotMessageListener";
import { getIO } from "../../libs/socket";
import wbotMonitor from "./wbotMonitor";
import { logger } from "../../utils/logger";
import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp,
  companyId: number
): Promise<void> => {
  // Verificar se já está conectado
  const whatsappUpdated = await Whatsapp.findOne({
    where: { id: whatsapp.id }
  });

  if (!whatsappUpdated) {
    logger.error(`WhatsApp ${whatsapp.id} não encontrado`);
    return;
  }

  // Se já estiver marcado como CONNECTED, verificar se realmente tem sessão ativa
  if (whatsappUpdated.status === "CONNECTED") {
    try {
      // Tentar obter a sessão da memória
      const wbot = getWbot(whatsapp.id);
      // Se chegou aqui, a sessão existe e está ativa
      logger.info(`WhatsApp ${whatsapp.name} (ID: ${whatsapp.id}) já está CONNECTED e tem sessão ativa na memória.`);
      const io = getIO();
      io.emit(`company-${companyId}-whatsappSession`, {
        action: "update",
        session: whatsappUpdated
      });
      return;
    } catch (err: any) {
      // Se erro é ERR_WAPP_NOT_INITIALIZED, significa que está marcado como CONNECTED mas não tem sessão
      // Isso acontece após restart do servidor
      if (err.message === "ERR_WAPP_NOT_INITIALIZED") {
        logger.warn(`WhatsApp ${whatsapp.name} (ID: ${whatsapp.id}) está marcado como CONNECTED mas não tem sessão na memória. Atualizando status e reinicializando.`);
        // Atualizar status para DISCONNECTED e continuar para reinicializar
        await whatsappUpdated.update({ status: "DISCONNECTED" });
        // Continuar para inicializar abaixo
      } else {
        // Outro tipo de erro, logar e retornar
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
