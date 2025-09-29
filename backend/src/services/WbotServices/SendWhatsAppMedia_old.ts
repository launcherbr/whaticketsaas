import { WAMessage, AnyMessageContent } from "baileys";
import * as Sentry from "@sentry/node";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Ticket from "../../models/Ticket";
import mime from "mime-types";

import ffmpegPath from "ffmpeg-static";
import formatBody from "../../helpers/Mustache";

interface Request {
  media: Express.Multer.File;
  ticket: Ticket;
  companyId?: number;
  body?: string;
  isForwarded?: boolean;  
}

ffmpeg.setFfmpegPath(ffmpegPath);

const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

const processAudio = async (audio: string, companyId: string): Promise<string> => {
  const outputAudio = `${publicFolder}/company${companyId}/${new Date().getTime()}.ogg`;
  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath} -i ${audio} -vn -c:a libopus -b:a 128k ${outputAudio} -y`,
      (error, _stdout, _stderr) => {
        if (error) reject(error);
        fs.unlinkSync(audio);
        resolve(outputAudio);
      }
    );
  });
};

const processAudioFile = async (audio: string, companyId: string): Promise<string> => {
  const outputAudio = `${publicFolder}/company${companyId}/${new Date().getTime()}.mp3`;
  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath} -i ${audio} -vn -ar 44100 -ac 2 -b:a 192k ${outputAudio}`,
      (error, _stdout, _stderr) => {
        if (error) reject(error);
        fs.unlinkSync(audio);
        resolve(outputAudio);
      }
    );
  });
};

export const getMessageOptions = async (
  fileName: string,
  pathMedia: string,
  companyId?: string,
  body: string = " "
): Promise<any> => {
  const mimeType = mime.lookup(pathMedia);
  const typeMessage = mimeType.split("/")[0];

  try {
    if (!mimeType) {
      throw new Error("Invalid mimetype");
    }
    let options: AnyMessageContent;

    if (typeMessage === "video") {
      options = {
        video: fs.readFileSync(pathMedia),
        caption: body ? body : null,
        fileName: fileName
      };
    } else if (typeMessage === "audio") {
      const typeAudio = true;
      const convert = await processAudio(pathMedia, companyId);
      if (typeAudio) {
        options = {
          audio: fs.readFileSync(convert),
          mimetype: "audio/ogg; codecs=opus",
          ptt: true,
        };
      } else {
        options = {
          audio: fs.readFileSync(convert),
          mimetype: typeAudio ? "audio/mp4" : mimeType,
          ptt: true
        };
      }
    } else if (typeMessage === "document" || fileName.endsWith('.psd')) {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: body ? body : null,
        fileName: fileName,
        mimetype: mimeType
      };
    } else if (typeMessage === "application") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: body ? body : null,
        fileName: fileName,
        mimetype: mimeType
      };
    } else {
      options = {
        image: fs.readFileSync(pathMedia),
        caption: body ? body : null,
      };
    }

    return options;
  } catch (e) {
    Sentry.captureException(e);
    console.log(e);
    return null;
  }
};

const SendWhatsAppMedia = async ({
  media,
  ticket,
  body,
  isForwarded = false
}: Request): Promise<WAMessage> => {
  try {
    const wbot = await GetTicketWbot(ticket);
    const companyId = ticket.companyId.toString();

    const pathMedia = media.path;
    const mimeType = media.mimetype;
    const typeMessage = mimeType.split("/")[0];
    const fileName = media.originalname.replace('/', '-');
    let options: AnyMessageContent;
    const bodyMessage = formatBody(body, ticket.contact);

    // Lista de tipos MIME de vídeo comuns
    const videoMimeTypes = [
      'video/mp4',
      'video/3gpp',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv',
      'video/x-matroska',
      'video/webm',
      'video/ogg'
    ];

    // Lista de extensões que devem ser tratadas como documento
    const documentExtensions = ['.psd', '.ai', '.eps', '.indd', '.xd', '.sketch'];

    // Verifica se é um arquivo PSD ou similar (deve ser tratado como documento)
    const shouldBeDocument = documentExtensions.some(ext => fileName.toLowerCase().endsWith(ext));

    if (shouldBeDocument) {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: bodyMessage,
        fileName: fileName,
        mimetype: mimeType
      };
    }
    // Verifica se é um vídeo (incluindo vários formatos)
    else if (typeMessage === "video" || videoMimeTypes.includes(mimeType)) {
      options = {
        video: fs.readFileSync(pathMedia),
        caption: bodyMessage,
        fileName: fileName,
        mimetype: mimeType
      };
    } else if (typeMessage === "audio") {
      // Verifica se o arquivo já é OGG
      if (mimeType === "audio/ogg") {
        options = {
          audio: fs.readFileSync(pathMedia),
          mimetype: "audio/ogg; codecs=opus",
          ptt: true
        };
      } else {
        // Converte para OGG se não for
        const convert = await processAudio(pathMedia, companyId);
        options = {
          audio: fs.readFileSync(convert),
          mimetype: "audio/ogg; codecs=opus",
          ptt: true
        };
      }
    } else if (typeMessage === "document" || mimeType === "application/pdf") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: bodyMessage,
        fileName: fileName,
        mimetype: mimeType
      };
    } else if (typeMessage === "image") {
      options = {
        image: fs.readFileSync(pathMedia),
        caption: bodyMessage
      };
    } else {
      // Caso o tipo de mídia não seja reconhecido, trata como documento
      options = {
        document: fs.readFileSync(pathMedia),
        caption: bodyMessage,
        fileName: fileName,
        mimetype: mimeType
      };
    }

    const sentMessage = await wbot.sendMessage(
      `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        ...options
      }
    );

    await ticket.update({ lastMessage: bodyMessage });

    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMedia;