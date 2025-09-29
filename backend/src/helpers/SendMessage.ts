import * as Sentry from "@sentry/node";
import fs from "fs/promises";
import path from "path";
import mime from "mime-types";
import { WAMessageContent, WAMessage } from "baileys";

import Whatsapp from "../models/Whatsapp";
import GetWhatsappWbot from "./GetWhatsappWbot";
import AppError from "../errors/AppError";
import { logger } from "../utils/logger";

export interface MessageData {
  number: string;
  body: string;
  mediaPath?: string;
  companyId: number;
}

export const SendMessage = async (
  whatsapp: Whatsapp,
  messageData: MessageData
): Promise<WAMessage> => {
  let wbot;
  try {
    wbot = await GetWhatsappWbot(whatsapp);
  } catch (error: any) {
    logger.error(`Failed to get Wbot for WhatsApp ID ${whatsapp.id}: ${error.message}`);
    throw new AppError(`ERR_GETTING_WAPP_BOT: ${error.message}`, 500);
  }

  const chatId = `${messageData.number}@s.whatsapp.net`;
  let messageContent: WAMessageContent;

  try {
    if (messageData.mediaPath) {
      const fullPath = path.resolve(
        "public",
        `company${messageData.companyId}`,
        messageData.mediaPath
      );
      const fileName = path.basename(fullPath);
      const mimeType = mime.lookup(fullPath);

      if (!mimeType) {
        throw new AppError(`Could not determine mime type for media: ${fileName}`, 400);
      }

      const fileBuffer = await fs.readFile(fullPath);
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new AppError(`Media file is empty: ${fileName}`, 400);
      }

      const fileType = mimeType.split("/")[0];
      const caption = messageData.body || "";

      switch (fileType) {
        case "image":
          messageContent = { 
            image: fileBuffer, 
            mimetype: mimeType, 
            caption: caption, 
            fileName: fileName 
          } as WAMessageContent;
          break;
        case "video":
          messageContent = { 
            video: fileBuffer, 
            mimetype: mimeType, 
            caption: caption, 
            fileName: fileName 
          } as WAMessageContent;
          break;
        case "audio":
          const isPtt = mimeType.includes("ogg");
          messageContent = { 
            audio: fileBuffer, 
            mimetype: mimeType, 
            ptt: isPtt, 
            fileName: fileName 
          } as WAMessageContent;
          if (!isPtt && caption) {
            logger.warn(`Caption for non-PTT audio might not be displayed: ${fileName}`);
          }
          break;
        default:
          messageContent = { 
            document: fileBuffer, 
            mimetype: mimeType, 
            fileName: fileName, 
            caption: caption 
          } as WAMessageContent;
          break;
      }
    } else {
      if (!messageData.body.trim()) {
        throw new AppError("Cannot send an empty text message.", 400);
      }
      messageContent = { text: `\u200e${messageData.body}` } as WAMessageContent;
    }

    logger.debug(`Sending message to ${chatId} via WhatsApp ${whatsapp.id}`);
    const sentMessage = await wbot.sendMessage(chatId, messageContent);

    if (!sentMessage) {
      throw new AppError("Failed to send message: Wbot returned undefined", 500);
    }

    logger.info(`Message sent successfully to ${chatId} (ID: ${sentMessage.key.id})`);
    return sentMessage;

  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(`Error sending message to ${chatId}: ${err.message}`);

    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(`ERR_SENDING_WAPP_MSG: ${err.message}`, 500);
  }
};
