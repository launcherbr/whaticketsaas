/**
 * Retorna o "sender" de WhatsApp para um ticket ou whatsappId.
 * Usa o socket libzapitu (getWbot) para envio de mensagens.
 */

import { getWbot } from "../libs/wbot";
import Whatsapp from "../models/Whatsapp";
import Ticket from "../models/Ticket";
import { WAMessage } from "libzapitu-rf";

export type WhatsAppSender = {
  id: number;
  sendMessage: (jid: string, content: Record<string, unknown>, options?: Record<string, unknown>) => Promise<WAMessage>;
  logout?: () => Promise<void>;
};

/** Retorna sender para um ticket (usado por GetTicketWbot). */
export async function getWhatsAppSenderForTicket(ticket: Ticket): Promise<WhatsAppSender> {
  const whatsappId = ticket.whatsappId;
  if (!whatsappId) {
    throw new Error("ERR_WAPP_NOT_FOUND");
  }
  const whatsapp = await Whatsapp.findByPk(whatsappId);
  if (!whatsapp) {
    throw new Error("ERR_WAPP_NOT_FOUND");
  }
  const wbot = getWbot(whatsappId);
  return {
    id: wbot.id!,
    sendMessage: (jid, content, options) => wbot.sendMessage(jid, content as any, options as any),
    logout: wbot.logout ? () => Promise.resolve(wbot.logout?.()).then(() => {}) : undefined
  };
}

/** Retorna sender por whatsappId (usado por filas, campanhas, agendamentos). */
export async function getWhatsAppSenderByWhatsappId(whatsappId: number): Promise<WhatsAppSender> {
  const whatsapp = await Whatsapp.findByPk(whatsappId);
  if (!whatsapp) {
    throw new Error("ERR_WAPP_NOT_FOUND");
  }
  const wbot = getWbot(whatsappId);
  return {
    id: wbot.id!,
    sendMessage: (jid, content, options) => wbot.sendMessage(jid, content as any, options as any),
    logout: wbot.logout ? () => Promise.resolve(wbot.logout?.()).then(() => {}) : undefined
  };
}
