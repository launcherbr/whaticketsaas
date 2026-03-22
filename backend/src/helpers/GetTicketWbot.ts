import { WASocket } from "libzapitu-rf";
import { getWbot } from "../libs/wbot";
import GetDefaultWhatsApp from "./GetDefaultWhatsApp";
import Ticket from "../models/Ticket";
import { Store } from "../libs/store";
import { getWhatsAppSenderForTicket, WhatsAppSender } from "./GetWhatsAppSender";

export type Session = (WASocket & { id?: number; store?: Store }) | WhatsAppSender;

const GetTicketWbot = async (ticket: Ticket): Promise<Session> => {
  if (!ticket.whatsappId) {
    const defaultWhatsapp = await GetDefaultWhatsApp(
      ticket.companyId,
      ticket.userId
    );

    await ticket.$set("whatsapp", defaultWhatsapp);
  }

  return getWhatsAppSenderForTicket(ticket);
};

export default GetTicketWbot;
