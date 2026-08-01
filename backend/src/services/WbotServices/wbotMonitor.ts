import {
  WASocket,
  BinaryNode,
  Contact as BContact,
} from "libzapitu-rf";
import * as Sentry from "@sentry/node";

import { Op } from "sequelize";
// import { getIO } from "../../libs/socket";
import { Store } from "../../libs/store";
import Contact from "../../models/Contact";
import Setting from "../../models/Setting";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import createOrUpdateBaileysService from "../BaileysServices/CreateOrUpdateBaileysService";
import CreateMessageService from "../MessageServices/CreateMessageService";
//import { addContactsUpdateJob } from "./ProcessContactsUpdate";


type Session = WASocket & {
  id?: number;
  store?: Store;
};

interface IContact {
  contacts: BContact[];
}

const wbotMonitor = async (
  wbot: Session,
  whatsapp: Whatsapp,
  companyId: number
): Promise<void> => {
  try {
    wbot.ws.on("CB:call", async (node: BinaryNode) => {
      try {
        const content = node.content?.[0] as any;
        const from = node.attrs?.from;

        if (!content?.tag) {
          logger.warn({ node }, "CB:call recebido sem content.tag");
          return;
        }

        if (content.tag === "offer") {
          return;
        }

        if (content.tag !== "terminate") {
          return;
        }

        const sendMsgCall = await Setting.findOne({
          where: { key: "call", companyId },
        });

        if (sendMsgCall?.value !== "disabled") {
          return;
        }

        if (!from) {
          logger.warn({ node }, "CB:call terminate recebido sem remetente");
          return;
        }

        await wbot.sendMessage(from, {
          text:
            "*Mensagem Automática:*\n\nAs chamadas de voz e vídeo estão desabilitas para esse WhatsApp, favor enviar uma mensagem de texto. Obrigado",
        });

        // Suporta números de qualquer país (até 15 dígitos conforme padrão internacional)
        const number = from.replace(/\D/g, "").slice(0, 15);

        if (!number) {
          logger.warn({ from }, "CB:call terminate sem numero valido");
          return;
        }

        const contact = await Contact.findOne({
          where: { companyId, number },
        });

        if (!contact) {
          logger.warn(
            { companyId, number },
            "CB:call terminate sem contato correspondente"
          );
          return;
        }

        if (!wbot.id) {
          logger.warn(
            { companyId, contactId: contact.id },
            "CB:call terminate sem sessao WhatsApp inicializada"
          );
          return;
        }

        const ticket = await Ticket.findOne({
          where: {
            contactId: contact.id,
            whatsappId: wbot.id,
            companyId
          },
        });

        // se não existir o ticket não faz nada.
        if (!ticket) {
          logger.warn(
            { companyId, contactId: contact.id, whatsappId: wbot.id },
            "CB:call terminate sem ticket correspondente"
          );
          return;
        }

        const date = new Date();
        const hours = date.getHours();
        const minutes = date.getMinutes();

        const body = `Chamada de voz/vídeo perdida às ${hours}:${minutes}`;
        const messageData = {
          id: content.attrs?.["call-id"] || `call-${Date.now()}`,
          ticketId: ticket.id,
          contactId: contact.id,
          body,
          fromMe: false,
          mediaType: "call_log",
          read: true,
          quotedMsgId: null,
          ack: 1,
        };

        await ticket.update({
          lastMessage: body,
        });

        if (ticket.status === "closed") {
          await ticket.update({
            status: "pending",
          });
        }

        return CreateMessageService({ messageData, companyId });
      } catch (error) {
        Sentry.captureException(error);
        logger.error({ error, node }, "Erro ao processar evento CB:call");
      }
    });

    wbot.ev.on("contacts.upsert", async (contacts: BContact[]) => {

      await createOrUpdateBaileysService({
        whatsappId: whatsapp.id,
        contacts,
      });
    });

  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
  }
};

export default wbotMonitor;
