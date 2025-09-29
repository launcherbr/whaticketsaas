import * as Sentry from "@sentry/node";
import { WAMessage } from "baileys";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { logger } from "../../utils/logger";
import formatBody from "../../helpers/Mustache";

import Queue from "bull";
import { map_msg, buildContactAddress } from "../../utils/global";

interface Request {
  body: string;
  ticket: Ticket;
  quotedMsg?: Message;
  isForwarded?: boolean;  
}

const SendWhatsAppMessage = async ({
  body,
  ticket,
  quotedMsg,
  isForwarded = false
}: Request): Promise<WAMessage> => {
  let options = {};
  const wbot = await GetTicketWbot(ticket);
  console.log('ticket.contact', ticket.contact);
  const number = buildContactAddress(ticket.contact, ticket.isGroup);
  console.log("number", number);
  if (quotedMsg) {
    const chatMessages = await Message.findOne({
      where: {
        id: quotedMsg.id
      }
    });

    if (chatMessages) {
      const msgFound = JSON.parse(chatMessages.dataJson);

      options = {
        quoted: {
          key: msgFound.key,
          message: {
            extendedTextMessage: msgFound.message.extendedTextMessage
          }
        }
      };
    }

  }

  const connection = process.env.REDIS_URI || "";

  const sendScheduledMessagesWbot = new Queue(
    "SendWbotMessages",
    connection
  );

  const messageData = {
    wbotId: wbot.id,
  number: number,
  text: formatBody(body, ticket.contact),
  options: { ...options }
};


  const sentMessage = sendScheduledMessagesWbot.add("SendMessageWbot", { messageData }, { delay: 500 });
  logger.info("Mensagem enviada via REDIS...");

  try {
    console.log('body:::::::::::::::::::::::::::', body)
    map_msg.set(ticket.contact.number, { lastSystemMsg: body })
    console.log('lastSystemMsg:::::::::::::::::::::::::::', ticket.contact.number)
    const sentMessage = await wbot.sendMessage(number, {
      text: formatBody(body, ticket.contact),
	  contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded ? true : false }
    },
      {
        ...options
      }
    );
    await ticket.update({ lastMessage: formatBody(body, ticket.contact) });
    console.log("Message sent", sentMessage);
    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMessage;
