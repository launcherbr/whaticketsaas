import * as Sentry from "@sentry/node";
import { writeFile } from "fs";
import { head, isNil } from "lodash";
import path, { join } from "path";
import { promisify } from "util";

import { getJidFromMessage, getLidFromMessage, map_msg } from "../../utils/global";

import {
  downloadMediaMessage,
  extractMessageContent,
  getContentType,
  jidNormalizedUser,
  MessageUpsertType,
  proto,
  WAMessage,
  WAMessageStubType,
  WAMessageUpdate,
  delay,
  Chat,
  WASocket,
} from "baileys";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { Mutex } from "async-mutex";

import {
  AudioConfig,
  SpeechConfig,
  SpeechSynthesizer
} from "microsoft-cognitiveservices-speech-sdk";
import moment from "moment";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { Op } from "sequelize";
import { debounce } from "../../helpers/Debounce";
import formatBody from "../../helpers/Mustache";
import ffmpeg from "fluent-ffmpeg";
import { cacheLayer } from "../../libs/cache";
import { getIO } from "../../libs/socket";
import { Store } from "../../libs/store";
import MarkDeleteWhatsAppMessage from "./MarkDeleteWhatsAppMessage";
import Campaign from "../../models/Campaign";
import * as MessageUtils from "./wbotGetMessageFromType";
import CampaignShipping from "../../models/CampaignShipping";
import Queue from "../../models/Queue";
import QueueIntegrations from "../../models/QueueIntegrations";
import QueueOption from "../../models/QueueOption";
import Setting from "../../models/Setting";
import TicketTraking from "../../models/TicketTraking";
import HolidayPeriod from "../../models/HolidayPeriod";
import User from "../../models/User";
import UserRating from "../../models/UserRating";
import { campaignQueue, parseToMilliseconds, randomValue } from "../../queues";
import { logger } from "../../utils/logger";
import VerifyCurrentSchedule from "../CompanyService/VerifyCurrentSchedule";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import CreateMessageService from "../MessageServices/CreateMessageService";
import ShowQueueIntegrationService from "../QueueIntegrationServices/ShowQueueIntegrationService";
import FindOrCreateATicketTrakingService from "../TicketServices/FindOrCreateATicketTrakingService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import typebotListener from "../TypebotServices/typebotListener";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import { provider } from "./providers";
import { SimpleObjectCache } from "../../helpers/simpleObjectCache";
import SendWhatsAppMessage from "./SendWhatsAppMessage";
import { getMessageOptions } from "./SendWhatsAppMedia";

import { addMsgAckJob } from "./BullAckService";
import { CreateOrUpdateBaileysChatService } from "../BaileysChatServices/CreateOrUpdateBaileysChatService";

import ffmpegPath from 'ffmpeg-static';
import mime from "mime-types";
import { ensureFolderPermissions, ensureFilePermissions } from "../../helpers/EnsurePermissions";
ffmpeg.setFfmpegPath(ffmpegPath);

const request = require("request");

const fs = require('fs')

type Session = WASocket & {
  id?: number;
  store?: Store;
  lidMappingStore?: any; // LIDMappingStore da v7.0.0-rc.2
};

interface SessionOpenAi extends OpenAIApi {
  id?: number;
}

const sessionsOpenAi: SessionOpenAi[] = [];

interface ImessageUpsert {
  messages: proto.IWebMessageInfo[];
  type: MessageUpsertType;
}

interface IMe {
  name: string;
  id: string;
  lid?: string;
  // originalJid?: string;
}

interface IMessage {
  messages: WAMessage[];
  isLatest: boolean;
}

const MESSAGE_CACHE_TTL = 300;

export const isNumeric = (value: string) => /^-?\d+$/.test(value);

const writeFileAsync = promisify(writeFile);

const wbotMutex = new Mutex();

const groupContactCache = new SimpleObjectCache(1000 * 30, logger);

// Função para normalizar JID removendo sufixos
const normalizeJid = (jid: string): string => {
  if (!jid) return '';
  return jid.replace(/@[^.]+\.whatsapp\.net$/, '@s.whatsapp.net');
};

// Função para unificar contatos duplicados
const unifyDuplicateContacts = async (companyId: number): Promise<void> => {
  try {
    const contacts = await Contact.findAll({
      where: { companyId },
      order: [['createdAt', 'ASC']]
    });
    
    const jidMap = new Map<string, Contact>();
    
    for (const contact of contacts) {
      const normalizedJid = normalizeJid(contact.number);
      
      if (jidMap.has(normalizedJid)) {
        // Unificar com contato existente
        const existingContact = jidMap.get(normalizedJid)!;
        
        // Atualizar tickets para usar o contato principal
        await Ticket.update(
          { contactId: existingContact.id },
          { where: { contactId: contact.id, companyId } }
        );
        
        // Atualizar mensagens para usar o contato principal
        await Message.update(
          { contactId: existingContact.id },
          { where: { contactId: contact.id, companyId } }
        );
        
        
        // Deletar contato duplicado
        await contact.destroy();
        
        logger.info(`Contato duplicado unificado: ${contact.number} -> ${existingContact.number}`);
      } else {
        jidMap.set(normalizedJid, contact);
      }
    }
  } catch (error) {
    logger.error(`Erro ao unificar contatos duplicados: ${error}`);
    Sentry.captureException(error);
  }
};

const multVecardGet = function (param: any) {
  let output = " "

  let name = param.split("\n")[2].replace(";;;", "\n").replace('N:', "").replace(";", "").replace(";", " ").replace(";;", " ").replace("\n", "")
  let inicio = param.split("\n")[4].indexOf('=')
  let fim = param.split("\n")[4].indexOf(':')
  let contact = param.split("\n")[4].substring(inicio + 1, fim).replace(";", "")
  let contactSemWhats = param.split("\n")[4].replace("item1.TEL:", "")

  if (contact != "item1.TEL") {
    output = output + name + ": 📞" + contact + "" + "\n"
  } else
    output = output + name + ": 📞" + contactSemWhats + "" + "\n"
  return output
}

const contactsArrayMessageGet = (msg: any,) => {
  let contactsArray = msg.message?.contactsArrayMessage?.contacts
  let vcardMulti = contactsArray.map(function (item, indice) {
    return item.vcard;
  });

  let bodymessage = ``
  vcardMulti.forEach(function (vcard, indice) {
    bodymessage += vcard + "\n\n" + ""
  })

  let contacts = bodymessage.split("BEGIN:")

  contacts.shift()
  let finalContacts = ""
  for (let contact of contacts) {
    finalContacts = finalContacts + multVecardGet(contact)
  }

  return finalContacts
}

export const getTypeMessage = (msg: proto.IWebMessageInfo): string => {
  return getContentType(msg.message);
};

export function validaCpfCnpj(val) {
  if (val.length == 11) {
    var cpf = val.trim();

    cpf = cpf.replace(/\./g, '');
    cpf = cpf.replace('-', '');
    cpf = cpf.split('');

    var v1 = 0;
    var v2 = 0;
    var aux = false;

    for (var i = 1; cpf.length > i; i++) {
      if (cpf[i - 1] != cpf[i]) {
        aux = true;
      }
    }

    if (aux == false) {
      return false;
    }

    for (var i = 0, p = 10; (cpf.length - 2) > i; i++, p--) {
      v1 += cpf[i] * p;
    }

    v1 = ((v1 * 10) % 11);

    if (v1 == 10) {
      v1 = 0;
    }

    if (v1 != cpf[9]) {
      return false;
    }

    for (var i = 0, p = 11; (cpf.length - 1) > i; i++, p--) {
      v2 += cpf[i] * p;
    }

    v2 = ((v2 * 10) % 11);

    if (v2 == 10) {
      v2 = 0;
    }

    if (v2 != cpf[10]) {
      return false;
    } else {
      return true;
    }
  } else if (val.length == 14) {
    var cnpj = val.trim();

    cnpj = cnpj.replace(/\./g, '');
    cnpj = cnpj.replace('-', '');
    cnpj = cnpj.replace('/', '');
    cnpj = cnpj.split('');

    var v1 = 0;
    var v2 = 0;
    var aux = false;

    for (var i = 1; cnpj.length > i; i++) {
      if (cnpj[i - 1] != cnpj[i]) {
        aux = true;
      }
    }

    if (aux == false) {
      return false;
    }

    for (var i = 0, p1 = 5, p2 = 13; (cnpj.length - 2) > i; i++, p1--, p2--) {
      if (p1 >= 2) {
        v1 += cnpj[i] * p1;
      } else {
        v1 += cnpj[i] * p2;
      }
    }

    v1 = (v1 % 11);

    if (v1 < 2) {
      v1 = 0;
    } else {
      v1 = (11 - v1);
    }

    if (v1 != cnpj[12]) {
      return false;
    }

    for (var i = 0, p1 = 6, p2 = 14; (cnpj.length - 1) > i; i++, p1--, p2--) {
      if (p1 >= 2) {
        v2 += cnpj[i] * p1;
      } else {
        v2 += cnpj[i] * p2;
      }
    }

    v2 = (v2 % 11);

    if (v2 < 2) {
      v2 = 0;
    } else {
      v2 = (11 - v2);
    }

    if (v2 != cnpj[13]) {
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sleep(time) {
  await timeout(time);
}
export const sendMessageImage = async (
  wbot: Session,
  contact,
  ticket: Ticket,
  url: string,
  caption: string
) => {

  let sentMessage
  try {
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        image: url ? { url } : fs.readFileSync(`public/temp/${caption}-${makeid(10)}`),
        fileName: caption,
        caption: caption,
        mimetype: 'image/jpeg'
      }
    );
  } catch (error) {
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        text: formatBody('Não consegui enviar o PDF, tente novamente!', contact)
      }
    );
  }
  verifyMessage(sentMessage, ticket, contact);
};

export const sendMessageLink = async (
  wbot: Session,
  contact: Contact,
  ticket: Ticket,
  url: string,
  caption: string
) => {

  let sentMessage
  try {
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
      document: url ? { url } : fs.readFileSync(`public/temp/${caption}-${makeid(10)}`),
      fileName: caption,
      caption: caption,
      mimetype: 'application/pdf'
    }
    );
  } catch (error) {
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
      text: formatBody('Não consegui enviar o PDF, tente novamente!', contact)
    }
    );
  }
  verifyMessage(sentMessage, ticket, contact);
};

export function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}


const getBodyButton = (msg: proto.IWebMessageInfo): string => {
  if (msg.key.fromMe && msg?.message?.viewOnceMessage?.message?.buttonsMessage?.contentText) {
    let bodyMessage = `*${msg?.message?.viewOnceMessage?.message?.buttonsMessage?.contentText}*`;

    for (const buton of msg.message?.viewOnceMessage?.message?.buttonsMessage?.buttons) {
      bodyMessage += `\n\n${buton.buttonText?.displayText}`;
    }
    return bodyMessage;
  }

  if (msg.key.fromMe && msg?.message?.viewOnceMessage?.message?.listMessage) {
    let bodyMessage = `*${msg?.message?.viewOnceMessage?.message?.listMessage?.description}*`;
    for (const buton of msg.message?.viewOnceMessage?.message?.listMessage?.sections) {
      for (const rows of buton.rows) {
        bodyMessage += `\n\n${rows.title}`;
      }
    }

    return bodyMessage;
  }
};

const msgLocation = (image, latitude, longitude) => {
  if (latitude && longitude) {
    if (image) {
      var b64 = Buffer.from(image).toString("base64");
      let data = `data:image/png;base64, ${b64} | https://maps.google.com/maps?q=${latitude}%2C${longitude}&z=17&hl=pt-BR|${latitude}, ${longitude} `;
      return data;
    } else {
      // Retorna dados da localização mesmo sem imagem
      return `https://maps.google.com/maps?q=${latitude}%2C${longitude}&z=17&hl=pt-BR|${latitude}, ${longitude}`;
    }
  }
  return null;
};

export const getBodyMessage = (msg: proto.IWebMessageInfo): string | null => {

  try {
    let type = getTypeMessage(msg);

    const types = {
      conversation: msg?.message?.conversation,
      editedMessage: msg?.message?.editedMessage?.message?.protocolMessage?.editedMessage?.conversation,
      imageMessage: msg.message?.imageMessage?.caption,
      videoMessage: msg.message?.videoMessage?.caption,
      extendedTextMessage: msg.message?.extendedTextMessage?.text,
      buttonsResponseMessage: msg.message?.buttonsResponseMessage?.selectedButtonId,
      templateButtonReplyMessage: msg.message?.templateButtonReplyMessage?.selectedId,
      messageContextInfo: msg.message?.buttonsResponseMessage?.selectedButtonId || msg.message?.listResponseMessage?.title,
      buttonsMessage: getBodyButton(msg) || msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
      viewOnceMessage: getBodyButton(msg) || msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
      stickerMessage: "sticker",
      reactionMessage: MessageUtils.getReactionMessage(msg) || "reaction",
      contactMessage: msg.message?.contactMessage?.vcard,
      contactsArrayMessage: (msg.message?.contactsArrayMessage?.contacts) && contactsArrayMessageGet(msg),
      //locationMessage: `Latitude: ${msg.message.locationMessage?.degreesLatitude} - Longitude: ${msg.message.locationMessage?.degreesLongitude}`,
      locationMessage: msgLocation(
        msg.message?.locationMessage?.jpegThumbnail,
        msg.message?.locationMessage?.degreesLatitude,
        msg.message?.locationMessage?.degreesLongitude
      ),
      liveLocationMessage: msgLocation(
        msg.message?.liveLocationMessage?.jpegThumbnail,
        msg.message?.liveLocationMessage?.degreesLatitude,
        msg.message?.liveLocationMessage?.degreesLongitude
      ),
      documentMessage: msg.message?.documentMessage?.title || msg.message?.documentMessage?.fileName || "Documento",
      documentWithCaptionMessage: msg.message?.documentWithCaptionMessage?.message?.documentMessage?.caption || msg.message?.documentWithCaptionMessage?.message?.documentMessage?.fileName || "Documento",
      audioMessage: "Áudio",
      listMessage: getBodyButton(msg) || msg.message?.listResponseMessage?.title,
      listResponseMessage: msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
    };

    const objKey = Object.keys(types).find(key => key === type);

    if (!objKey) {
      logger.warn(`#### Nao achou o type 152: ${type}
${JSON.stringify(msg)}`);
      Sentry.setExtra("Mensagem", { BodyMsg: msg.message, msg, type });
      Sentry.captureException(
        new Error("Novo Tipo de Mensagem em getTypeMessage")
      );
    }
    return types[type];
  } catch (error) {
    Sentry.setExtra("Error getTypeMessage", { msg, BodyMsg: msg.message });
    Sentry.captureException(error);
    console.log(error);
  }
};


export const getQuotedMessage = (msg: proto.IWebMessageInfo): any => {
  const body =
    msg.message.imageMessage.contextInfo ||
    msg.message.videoMessage.contextInfo ||
    msg.message?.documentMessage ||
    msg.message.extendedTextMessage.contextInfo ||
    msg.message.buttonsResponseMessage.contextInfo ||
    msg.message.listResponseMessage.contextInfo ||
    msg.message.templateButtonReplyMessage.contextInfo ||
    msg.message.buttonsResponseMessage?.contextInfo ||
    msg?.message?.buttonsResponseMessage?.selectedButtonId ||
    msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
    msg?.message?.listResponseMessage?.singleSelectReply.selectedRowId ||
    msg.message.listResponseMessage?.contextInfo;
  msg.message.senderKeyDistributionMessage;

  // testar isso

  return extractMessageContent(body[Object.keys(body).values().next().value]);
};
export const getQuotedMessageId = (msg: proto.IWebMessageInfo) => {
  const body = extractMessageContent(msg.message)[
    Object.keys(msg?.message).values().next().value
    ];
  let reaction = msg?.message?.reactionMessage
    ? msg?.message?.reactionMessage?.key?.id
    : "";

  return reaction ? reaction : body?.contextInfo?.stanzaId;
};

const getMeSocket = (wbot: Session): IMe => {
  return {
    id: jidNormalizedUser((wbot as WASocket).user.id),
    name: (wbot as WASocket).user.name
  }
};

const getSenderMessage = (
  msg: proto.IWebMessageInfo,
  wbot: Session
): string => {
  const me = getMeSocket(wbot);
  if (msg.key.fromMe) return me.id;

  const senderId = msg.participant || msg.key.participant || msg.key.remoteJid || undefined;
  console.log('senderId:::::', senderId)

  return senderId && jidNormalizedUser(senderId);
};

const getContactMessage = async (msg: proto.IWebMessageInfo, wbot: Session) => {
  try {
    const isGroup = msg.key.remoteJid.includes("g.us");

    // Obter JID e LID usando as funções seguras do global.ts
    const jid = await getJidFromMessage(msg, wbot);
    const lid = await getLidFromMessage(msg, wbot);

    // Validação dos dados obtidos
    if (!jid || typeof jid !== 'string') {
      throw new Error('JID inválido obtido da mensagem');
    }

    const rawNumber = jid.replace(/\D/g, "");

    // Log para debug (pode ser removido em produção)
    console.log('DEBUG - jid:', jid);
    console.log('DEBUG - lid:', lid);
    console.log('DEBUG - isGroup:', isGroup);

    if (isGroup) {
      // Para grupos, usar getSenderMessage que já está validado
      const senderId = getSenderMessage(msg, wbot);
      return {
        id: senderId,
        name: msg.pushName,
        lid: null // Grupos não usam LID
      };
    } else {
      // Para contatos individuais, usar JID e LID apropriadamente
      return {
        id: jid,
        name: msg.key.fromMe ? rawNumber : (msg.pushName || rawNumber),
        lid: lid || null
      };
    }
  } catch (error) {
    logger.error(`Erro em getContactMessage: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    throw new Error('Falha ao processar contato da mensagem');
  }
};

const downloadMedia = async (msg: proto.IWebMessageInfo) => {

  let buffer
  try {
    // Type assertion para garantir compatibilidade
    buffer = await downloadMediaMessage(
      msg as proto.IWebMessageInfo & { key: proto.IMessageKey },
      'buffer',
      {}
    )
  } catch (err) {


    console.error('Erro ao baixar mídia:', err);

    // Trate o erro de acordo com as suas necessidades
  }

  let filename = msg.message?.documentMessage?.fileName || "";

  const mineType =
    msg.message?.imageMessage ||
    msg.message?.audioMessage ||
    msg.message?.videoMessage ||
    msg.message?.stickerMessage ||
    msg.message?.documentMessage ||
    msg.message?.documentWithCaptionMessage?.message?.documentMessage ||
    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;

  if (!mineType)
    console.log(msg)

  if (!filename) {
    // IMPORTANTE: Verificar se o mimetype é image/gif para garantir extensão correta
    // GIFs podem vir como videoMessage mas o mimetype sempre será image/gif
    const ext = mineType.mimetype === "image/gif" ? "gif" : mineType.mimetype.split("/")[1].split(";")[0];
    filename = `${new Date().getTime()}.${ext}`;
  } else {
    // Se já tem filename mas o mimetype é image/gif, garantir que a extensão seja .gif
    if (mineType.mimetype === "image/gif" && !filename.toLowerCase().endsWith('.gif')) {
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
      filename = `${nameWithoutExt}.gif`;
    }
    filename = `${new Date().getTime()}_${filename}`;
  }

  // IMPORTANTE: Preservar mimetype correto para GIFs
  // GIFs podem vir como videoMessage com mimetype video/mp4 mas com gifPlayback: true
  // Ou podem vir como videoMessage/imageMessage com mimetype image/gif
  const videoMsg = msg.message?.videoMessage;
  const imageMsg = msg.message?.imageMessage;
  const isGifByMimetype = videoMsg?.mimetype === "image/gif" || imageMsg?.mimetype === "image/gif";
  const isGifByPlayback = videoMsg?.gifPlayback === true;
  const isGif = isGifByMimetype || isGifByPlayback;
  
  let finalMimetype = mineType.mimetype;
  let finalFilename = filename;
  
  if (isGif) {
    // Se for GIF detectado por gifPlayback, manter mimetype como video/mp4 mas salvar como .mp4
    // Se for GIF detectado por mimetype, usar image/gif e salvar como .gif
    if (isGifByPlayback && !isGifByMimetype) {
      // GIF convertido para MP4 pelo WhatsApp - manter como MP4
      finalMimetype = "video/mp4";
      // Garantir que a extensão seja .mp4
      if (!finalFilename.toLowerCase().endsWith('.mp4')) {
        const nameWithoutExt = finalFilename.replace(/\.[^/.]+$/, "");
        finalFilename = `${nameWithoutExt}.mp4`;
      }
    } else {
      // GIF tradicional - usar image/gif
      finalMimetype = "image/gif";
      // Garantir que a extensão seja .gif
      if (!finalFilename.toLowerCase().endsWith('.gif')) {
        const nameWithoutExt = finalFilename.replace(/\.[^/.]+$/, "");
        finalFilename = `${nameWithoutExt}.gif`;
      }
    }
  }

  const media = {
    data: buffer,
    mimetype: finalMimetype,
    filename: finalFilename
  };

  return media;
}


const resolveContactIdentifiers = async (msgContact: IMe, wbot: Session) => {
  const rawId = msgContact?.id || "";
  const isGroup = rawId.includes("g.us");
  const baseNumber = rawId.replace(/\D/g, "");
  const lidFromContact = msgContact?.lid || (rawId.includes("@lid") ? rawId : null);

  if (isGroup) {
    return {
      number: baseNumber,
      lid: null
    };
  }

  const lidMappingStore = (wbot as any)?.lidMappingStore;
  let resolvedNumber = baseNumber;
  let resolvedLid = lidFromContact;

  const widUser = (msgContact as any)?.wid?.user;
  if (widUser) {
    resolvedNumber = widUser.replace(/\D/g, "");
  }

  if (lidFromContact) {
    try {
      if (lidMappingStore?.getPNForLID) {
        const mappedJid = await lidMappingStore.getPNForLID(lidFromContact);
        if (mappedJid && typeof mappedJid === "string") {
          resolvedNumber = mappedJid.replace(/\D/g, "");
        }
      }
    } catch (error) {
      logger.warn(`Falha ao mapear LID para PN: ${(error as Error).message}`);
    }
  }

  if (!resolvedNumber && baseNumber) {
    resolvedNumber = baseNumber;
  }

  return {
    number: resolvedNumber,
    lid: resolvedLid
  };
};

const verifyContact = async (
  msgContact: IMe,
  wbot: Session,
  companyId: number
): Promise<Contact> => {
  let profilePicUrl: string;
  try {
    profilePicUrl = await wbot.profilePictureUrl(msgContact.id);
  } catch (e) {
    Sentry.captureException(e);
    profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
  }


  const contactData = {
    name: msgContact?.name || msgContact.id.replace(/\D/g, ""),
    number: msgContact.id.replace(/\D/g, ""),
    lid: msgContact.lid,
    profilePicUrl,
    isGroup: msgContact.id.includes("g.us"),
    companyId,
    whatsappId: wbot.id,
    pushName: msgContact?.name // Passar o pushName para atualização
  };
  console.log('contactData:::::', contactData);

  const contact = CreateOrUpdateContactService(contactData);

  return contact;
};

const verifyQuotedMessage = async (
  msg: proto.IWebMessageInfo
): Promise<Message | null> => {
  if (!msg) return null;
  const quoted = getQuotedMessageId(msg);

  if (!quoted) return null;

  const quotedMsg = await Message.findOne({
    where: { id: quoted },
  });

  if (!quotedMsg) return null;

  return quotedMsg;
};

const sanitizeName = (name: string): string => {
  let sanitized = name.split(" ")[0];
  sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, "");
  return sanitized.substring(0, 60);
};
const convertTextToSpeechAndSaveToFile = (
  text: string,
  filename: string,
  subscriptionKey: string,
  serviceRegion: string,
  voice: string = "pt-BR-FabioNeural",
  audioToFormat: string = "mp3"
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const speechConfig = SpeechConfig.fromSubscription(
      subscriptionKey,
      serviceRegion
    );
    speechConfig.speechSynthesisVoiceName = voice;
    const audioConfig = AudioConfig.fromAudioFileOutput(`${filename}.wav`);
    const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);
    synthesizer.speakTextAsync(
      text,
      result => {
        if (result) {
          convertWavToAnotherFormat(
            `${filename}.wav`,
            `${filename}.${audioToFormat}`,
            audioToFormat
          )
            .then(output => {
              resolve();
            })
            .catch(error => {
              console.error(error);
              reject(error);
            });
        } else {
          reject(new Error("No result from synthesizer"));
        }
        synthesizer.close();
      },
      error => {
        console.error(`Error: ${error}`);
        synthesizer.close();
        reject(error);
      }
    );
  });
};

const convertWavToAnotherFormat = (
  inputPath: string,
  outputPath: string,
  toFormat: string
) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .toFormat(toFormat)
      .on("end", () => resolve(outputPath))
      .on("error", (err: { message: any }) =>
        reject(new Error(`Error converting file: ${err.message}`))
      )
      .save(outputPath);
  });
};

const deleteFileSync = (path: string): void => {
  try {
    fs.unlinkSync(path);
  } catch (error) {
    console.error("Erro ao deletar o arquivo:", error);
  }
};

const keepOnlySpecifiedChars = (str: string) => {
  return str.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚâêîôûÂÊÎÔÛãõÃÕçÇ!?.,;:\s]/g, "");
};
const handleOpenAi = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  ticket: Ticket,
  contact: Contact,
  mediaSent: Message | undefined
): Promise<void> => {
  const bodyMessage = getBodyMessage(msg);

  if (!bodyMessage) return;


  let { prompt } = await ShowWhatsAppService(wbot.id, ticket.companyId);


  if (!prompt && !isNil(ticket?.queue?.prompt)) {
    prompt = ticket.queue.prompt;
  }

  if (!prompt) return;

  if (msg.messageStubType) return;

  const publicFolder: string = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "public"
  );

  let openai: SessionOpenAi;
  const openAiIndex = sessionsOpenAi.findIndex(s => s.id === wbot.id);


  if (openAiIndex === -1) {
    const configuration = new Configuration({
      apiKey: prompt.apiKey
    });
    openai = new OpenAIApi(configuration);
    openai.id = wbot.id;
    sessionsOpenAi.push(openai);
  } else {
    openai = sessionsOpenAi[openAiIndex];
  }

  const messages = await Message.findAll({
    where: { ticketId: ticket.id },
    order: [["createdAt", "ASC"]],
    limit: prompt.maxMessages
  });

  const promptSystem = `Nas respostas utilize o nome ${sanitizeName(
    contact.name || "Amigo(a)"
  )} para identificar o cliente.\nSua resposta deve usar no máximo ${prompt.maxTokens
    } tokens e cuide para não truncar o final.\nSempre que possível, mencione o nome dele para ser mais personalizado o atendimento e mais educado. Quando a resposta requer uma transferência para o setor de atendimento, comece sua resposta com 'Ação: Transferir para o setor de atendimento'.\n
  ${prompt.prompt}\n`;

  let messagesOpenAi: ChatCompletionRequestMessage[] = [];

  if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) {
    messagesOpenAi = [];
    messagesOpenAi.push({ role: "system", content: promptSystem });
    for (
      let i = 0;
      i < Math.min(prompt.maxMessages, messages.length);
      i++
    ) {
      const message = messages[i];
      if (message.mediaType === "chat") {
        if (message.fromMe) {
          messagesOpenAi.push({ role: "assistant", content: message.body });
        } else {
          messagesOpenAi.push({ role: "user", content: message.body });
        }
      }
    }
    messagesOpenAi.push({ role: "user", content: bodyMessage! });

    const chat = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-1106",
      messages: messagesOpenAi,
      max_tokens: prompt.maxTokens,
      temperature: prompt.temperature
    });

    let response = chat.data.choices[0].message?.content;

    if (response?.includes("Ação: Transferir para o setor de atendimento")) {
      await transferQueue(prompt.queueId, ticket, contact);
      response = response
        .replace("Ação: Transferir para o setor de atendimento", "")
        .trim();
    }

    if (prompt.voice === "texto") {
      const sentMessage = await wbot.sendMessage(msg.key.remoteJid!, {
        text: response!
      });
      await verifyMessage(sentMessage!, ticket, contact);
    } else {
      const fileNameWithOutExtension = `${ticket.id}_${Date.now()}`;
      convertTextToSpeechAndSaveToFile(
        keepOnlySpecifiedChars(response!),
        `${publicFolder}/${fileNameWithOutExtension}`,
        prompt.voiceKey,
        prompt.voiceRegion,
        prompt.voice,
        "mp3"
      ).then(async () => {
        try {
          const sendMessage = await wbot.sendMessage(msg.key.remoteJid!, {
            audio: { url: `${publicFolder}/${fileNameWithOutExtension}.mp3` },
            mimetype: "audio/mpeg",
            ptt: true
          });
          await verifyMediaMessage(sendMessage!, ticket, contact);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.mp3`);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.wav`);
        } catch (error) {
          console.log(`Erro para responder com audio: ${error}`);
        }
      });
    }
  } else if (msg.message?.audioMessage) {
    const mediaUrl = mediaSent!.mediaUrl!.split("/").pop();
    const file = fs.createReadStream(`${publicFolder}/${mediaUrl}`) as any;
    const transcription = await openai.createTranscription(file, "whisper-1");

    messagesOpenAi = [];
    messagesOpenAi.push({ role: "system", content: promptSystem });
    for (
      let i = 0;
      i < Math.min(prompt.maxMessages, messages.length);
      i++
    ) {
      const message = messages[i];
      if (message.mediaType === "chat") {
        if (message.fromMe) {
          messagesOpenAi.push({ role: "assistant", content: message.body });
        } else {
          messagesOpenAi.push({ role: "user", content: message.body });
        }
      }
    }
    messagesOpenAi.push({ role: "user", content: transcription.data.text });
    const chat = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-1106",
      messages: messagesOpenAi,
      max_tokens: prompt.maxTokens,
      temperature: prompt.temperature
    });
    let response = chat.data.choices[0].message?.content;

    if (response?.includes("Ação: Transferir para o setor de atendimento")) {
      await transferQueue(prompt.queueId, ticket, contact);
      response = response
        .replace("Ação: Transferir para o setor de atendimento", "")
        .trim();
    }
    if (prompt.voice === "texto") {
      const sentMessage = await wbot.sendMessage(msg.key.remoteJid!, {
        text: response!
      });
      await verifyMessage(sentMessage!, ticket, contact);
    } else {
      const fileNameWithOutExtension = `${ticket.id}_${Date.now()}`;
      convertTextToSpeechAndSaveToFile(
        keepOnlySpecifiedChars(response!),
        `${publicFolder}/${fileNameWithOutExtension}`,
        prompt.voiceKey,
        prompt.voiceRegion,
        prompt.voice,
        "mp3"
      ).then(async () => {
        try {
          const sendMessage = await wbot.sendMessage(msg.key.remoteJid!, {
            audio: { url: `${publicFolder}/${fileNameWithOutExtension}.mp3` },
            mimetype: "audio/mpeg",
            ptt: true
          });
          await verifyMediaMessage(sendMessage!, ticket, contact);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.mp3`);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.wav`);
        } catch (error) {
          console.log(`Erro para responder com audio: ${error}`);
        }
      });
    }
  }
  messagesOpenAi = [];
};


const transferQueue = async (
  queueId: number,
  ticket: Ticket,
  contact: Contact
): Promise<void> => {
  await UpdateTicketService({
    ticketData: { queueId: queueId, useIntegration: false, promptId: null },
    ticketId: ticket.id,
    companyId: ticket.companyId
  });
};


const verifyMediaMessage = async (
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact
): Promise<Message> => {
  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  
  // Tratamento especial para localizações que podem não ter mídia para baixar
  const msgType = getTypeMessage(msg);
  if (msgType === "locationMessage" || msgType === "liveLocationMessage") {
    const body = getBodyMessage(msg);
    if (body) {
      // Processa como mensagem de texto com os dados da localização
      const isEdited = getTypeMessage(msg) == 'editedMessage';
      const messageData = {
        id: isEdited ? msg?.message?.editedMessage?.message?.protocolMessage?.key?.id : msg.key.id,
        ticketId: ticket.id,
        contactId: msg.key.fromMe ? undefined : contact.id,
        body,
        fromMe: msg.key.fromMe,
        mediaType: getTypeMessage(msg),
        read: msg.key.fromMe,
        quotedMsgId: quotedMsg?.id,
        ack: msg.status || 0,
        remoteJid: msg.key.remoteJid,
        participant: msg.key.participant,
        dataJson: JSON.stringify(msg),
        isEdited: isEdited,
      };

      await ticket.update({
        lastMessage: body
      });

      const newMessage = await CreateMessageService({ messageData, companyId: ticket.companyId });

      if (!msg.key.fromMe && ticket.status === "closed") {
        await ticket.update({ status: "pending" });
        await ticket.reload({
          include: [
            { model: Queue, as: "queue" },
            { model: User, as: "user" },
            { model: Contact, as: "contact" }
          ]
        });

        io.to(`company-${ticket.companyId}-closed`)
          .to(`queue-${ticket.queueId}-closed`)
          .emit(`company-${ticket.companyId}-ticket`, {
            action: "delete",
            ticket,
            ticketId: ticket.id
          });

        io.to(`company-${ticket.companyId}-${ticket.status}`)
          .to(`queue-${ticket.queueId}-${ticket.status}`)
          .to(ticket.id.toString())
          .emit(`company-${ticket.companyId}-ticket`, {
            action: "update",
            ticket,
            ticketId: ticket.id
          });
      }

      return newMessage;
    }
  }
  
  // Se o msg tem mediaUrl (adicionado manualmente, como na mídia de saudação), 
  // significa que o arquivo já está no servidor, não precisa baixar
  const preDefinedMediaUrl = (msg as any).mediaUrl;
  
  let media;
  let mediaFilename;
  
  if (preDefinedMediaUrl) {
    // Arquivo já está no servidor, usa o caminho fornecido
    mediaFilename = preDefinedMediaUrl;
    // Para determinar o tipo de mídia, tenta extrair do dataJson ou usa o caminho
    const msgType = getTypeMessage(msg);
    const isImage = msgType === "imageMessage" || msgType === "imageWithCaptionMessage";
    const isVideo = msgType === "videoMessage" || msgType === "videoWithCaptionMessage";
    const isAudio = msgType === "audioMessage";
    const isDocument = msgType === "documentMessage" || msgType === "documentWithCaptionMessage";
    const isSticker = msgType === "stickerMessage";
    
    // Cria um objeto media simulado para continuar o fluxo
    // IMPORTANTE: Verificar se é GIF pelo mimetype da mensagem ANTES de definir o mimetype
    const imageMsg = msg.message?.imageMessage;
    const videoMsg = msg.message?.videoMessage;
    const isGif = imageMsg?.mimetype === "image/gif" || videoMsg?.mimetype === "image/gif";
    
    let mimetype: string;
    if (isGif) {
      // Se for GIF, sempre usar image/gif mesmo que venha como videoMessage
      mimetype = "image/gif";
    } else {
      // Caso contrário, usar a lógica padrão
      mimetype = isImage ? "image/jpeg" : 
                 isVideo ? "video/mp4" : 
                 isAudio ? "audio/ogg" : 
                 isDocument ? "application/pdf" : 
                 isSticker ? "image/webp" : "image/jpeg";
    }
    
    // Cria um objeto media simulado para continuar o fluxo
    media = {
      filename: mediaFilename,
      mimetype: mimetype,
      data: null // Não precisa dos dados, arquivo já está salvo
    };
  } else {
    // Precisa baixar a mídia do WhatsApp
    media = await downloadMedia(msg);

    if (!media) {
      throw new Error("ERR_WAPP_DOWNLOAD_MEDIA");
    }

    // Verificar se é GIF antes de determinar extensão
    const videoMsg = msg.message?.videoMessage;
    const isGifByPlayback = videoMsg?.gifPlayback === true;
    const isGifByMimetype = media.mimetype === "image/gif";
    
    if (!media.filename) {
      // Se for GIF por gifPlayback, usar .mp4, senão usar extensão do mimetype
      const ext = isGifByPlayback ? "mp4" : 
                  isGifByMimetype ? "gif" : 
                  media.mimetype.split("/")[1].split(";")[0];
      media.filename = `${new Date().getTime()}.${ext}`;
    } else {
      // Se já tem filename, verificar se precisa ajustar extensão
      if (isGifByPlayback && !media.filename.toLowerCase().endsWith('.mp4')) {
        const nameWithoutExt = media.filename.replace(/\.[^/.]+$/, "");
        media.filename = `${nameWithoutExt}.mp4`;
      } else if (isGifByMimetype && !media.filename.toLowerCase().endsWith('.gif')) {
        const nameWithoutExt = media.filename.replace(/\.[^/.]+$/, "");
        media.filename = `${nameWithoutExt}.gif`;
      }
    }
    mediaFilename = media.filename;
  }

  // Determinar se é sticker ANTES de salvar (para escolher a pasta correta)
  const baileysMsgTypeForFolder = getTypeMessage(msg);
  const isStickerForFolder = baileysMsgTypeForFolder === 'stickerMessage';

  // Salvar arquivo se não foi predefinido
  if (!preDefinedMediaUrl) {
    try {
      // Para stickers, salvar em companyId/stickers/ (não na raiz)
      // Para outros tipos de mídia, salvar na raiz companyId/
      const baseFolder = `public/company${ticket.companyId}`;
      const folder = isStickerForFolder ? `${baseFolder}/stickers` : baseFolder;
      
      // Criar pasta e garantir permissões corretas
      const folderFullPath = join(__dirname, "..", "..", "..", folder);
      ensureFolderPermissions(folderFullPath);

      // Salvar arquivo: se for Buffer, salvar como binário; se for string, salvar como base64
      const savedFilePath = join(folderFullPath, media.filename);
      
      if (Buffer.isBuffer(media.data)) {
        await writeFileAsync(savedFilePath, media.data);
      } else {
        await writeFileAsync(savedFilePath, media.data, "base64");
      }
      
      // CORRIGIR PERMISSÕES DO ARQUIVO SALVO
      ensureFilePermissions(savedFilePath);

      await new Promise<void>((resolve, reject) => {
        if (media.filename.includes('.ogg')) {
        ffmpeg(folder + '/' + media.filename)
          .toFormat('mp3')
          .save((folder + '/' + media.filename).replace('.ogg', '.mp3'))
          .on('end', () => {
            logger.info('Conversão concluída!');
            resolve();
          })
          .on('error', (err) => {
            logger.error('Erro durante a conversão:', err);
            reject(err);
          });
        } else {
            logger.info('Não é necessário converter o arquivo. Não é formato OGG.');
            resolve(); // Resolve immediately since no conversion is needed.
        }
      });
      
      // NOVO SISTEMA: Renomear stickers para padrão sequencial (stickers01, stickers02, etc)
      if (isStickerForFolder) {
        try {
          const Sticker = (await import("../../models/Sticker")).default;
          
          // Buscar último sticker da empresa para gerar próximo ID
          const lastSticker = await Sticker.findOne({
            where: { companyId: ticket.companyId },
            order: [['id', 'DESC']]
          });
          
          // Gerar próximo número
          const nextNumber = lastSticker ? lastSticker.id + 1 : 1;
          const paddedNumber = String(nextNumber).padStart(2, '0');
          
          // Obter extensão do arquivo original
          const ext = path.extname(media.filename).toLowerCase() || '.webp';
          const newFileName = `stickers${paddedNumber}${ext}`;
          
          // Caminhos dos arquivos
          const oldPath = path.join(__dirname, "..", "..", "..", folder, media.filename);
          let newPath = path.join(__dirname, "..", "..", "..", folder, newFileName);
          
          // Se arquivo já existe, encontrar próximo disponível
          let finalFileName = newFileName;
          let counter = nextNumber;
          
          while (fs.existsSync(newPath)) {
            counter++;
            const paddedCounter = String(counter).padStart(2, '0');
            finalFileName = `stickers${paddedCounter}${ext}`;
            newPath = path.join(__dirname, "..", "..", "..", folder, finalFileName);
          }
          
          // Renomear arquivo
          fs.renameSync(oldPath, newPath);
          media.filename = finalFileName; // Atualizar o filename no objeto media
          mediaFilename = finalFileName; // Atualizar também a variável local
          
          logger.info(`✅ Sticker renomeado: ${media.filename}`);
        } catch (err) {
          logger.error('Erro ao renomear sticker:', err);
          // Continuar com o nome original em caso de erro
        }
      }
    } catch (err) {
      Sentry.captureException(err);
      logger.error(err);
    }
  }

  let body = getBodyMessage(msg);
  
  // IMPORTANTE: Verificar se é GIF PRIMEIRO, antes de qualquer outra coisa
  // GIFs podem vir como videoMessage com mimetype video/mp4 mas com gifPlayback: true
  // Ou podem vir como videoMessage/imageMessage com mimetype image/gif
  const baileysMsgType = getTypeMessage(msg);
  const videoMsg = msg.message?.videoMessage;
  const imageMsg = msg.message?.imageMessage;
  
  // Verificar se é GIF:
  // 1. Pelo mimetype image/gif
  // 2. Pela propriedade gifPlayback: true (GIFs convertidos para MP4 pelo WhatsApp)
  const isGifByMimetype = videoMsg?.mimetype === "image/gif" || imageMsg?.mimetype === "image/gif" || media.mimetype === "image/gif";
  const isGifByPlayback = videoMsg?.gifPlayback === true;
  const isGif = isGifByMimetype || isGifByPlayback;
  
  // Log para debug
  if (isGif || baileysMsgType === 'videoMessage' || baileysMsgType === 'imageMessage') {
    console.log("DEBUG GIF - verifyMediaMessage:", {
      baileysMsgType,
      videoMsgMimetype: videoMsg?.mimetype,
      imageMsgMimetype: imageMsg?.mimetype,
      mediaMimetype: media.mimetype,
      gifPlayback: videoMsg?.gifPlayback,
      isGifByMimetype,
      isGifByPlayback,
      isGif,
      mediaFilename
    });
  }
  
  let mediaType: string;
  if (isGif) {
    // GIFs devem ser tratados como mídia especial "gif", não como vídeo ou imagem comum
    mediaType = "gif";
    // Se foi detectado por gifPlayback mas o mimetype é video/mp4, 
    // manter o mimetype como video/mp4 mas salvar como mediaType "gif"
    // O arquivo já foi salvo como .mp4, mas vamos tratar como GIF no sistema
    if (isGifByPlayback && !isGifByMimetype) {
      // Não alterar o mimetype do media, apenas o mediaType
      console.log("DEBUG GIF - GIF detectado por gifPlayback, mantendo mimetype video/mp4 mas mediaType=gif");
    } else if (media.mimetype !== "image/gif") {
      // Se foi detectado por mimetype, garantir que o mimetype esteja correto
      media.mimetype = "image/gif";
    }
    console.log("DEBUG GIF - Definindo mediaType como 'gif'");
  } else {
    // Se não é GIF, então normalizar mediaType baseado no tipo do Baileys
    mediaType = media.mimetype.split("/")[0];
    
    if (baileysMsgType === 'documentMessage' || baileysMsgType === 'documentWithCaptionMessage') {
      mediaType = media.mimetype.split("/")[0] === "application" ? "application" : "document";
    } else if (baileysMsgType === 'stickerMessage') {
      mediaType = "sticker";
    }
  }
  
  // Garantir que body nunca seja null ou undefined
  if (!body || body.trim() === '') {
    if (mediaType === 'document' || mediaType === 'application') {
      body = media.filename || "Documento";
    } else if (mediaType === 'image') {
      body = "📷 Imagem";
    } else if (mediaType === 'video') {
      body = "🎥 Vídeo";
    } else if (mediaType === 'audio') {
      body = "🎵 Áudio";
    } else if (mediaType === 'sticker') {
      body = "🎨 Sticker";
    } else if (mediaType === 'gif') {
      body = "GIF";
    } else {
      body = "📎 Mídia";
    }
  }

  // Log final antes de salvar
  if (mediaType === "gif" || baileysMsgType === 'videoMessage' || baileysMsgType === 'imageMessage') {
    console.log("DEBUG GIF - verifyMediaMessage: Salvando mensagem com mediaType:", mediaType, {
      mediaFilename,
      mediaMimetype: media.mimetype
    });
  }

  // Para stickers, incluir o path completo no mediaUrl para facilitar o carregamento no frontend
  let finalMediaUrl = mediaFilename;
  if (mediaType === "sticker") {
    // Incluir path stickers/ no mediaUrl para que o frontend saiba onde buscar
    // Verificar se já não tem o path (para compatibilidade)
    if (!finalMediaUrl.startsWith('stickers/')) {
      finalMediaUrl = `stickers/${mediaFilename}`;
    }
    console.log("DEBUG STICKER - verifyMediaMessage: mediaUrl ajustado:", {
      original: mediaFilename,
      final: finalMediaUrl,
      mediaType,
      isStickerForFolder
    });
  }

  const messageData = {
    id: msg.key.id,
    ticketId: ticket.id,
    contactId: msg.key.fromMe ? undefined : contact.id,
    body: formatBody(body, ticket.contact) || body || "📎 Mídia",
    fromMe: msg.key.fromMe,
    read: msg.key.fromMe,
    mediaUrl: finalMediaUrl,
    mediaType: mediaType,
    quotedMsgId: quotedMsg?.id,
    ack: msg.status ?? 0, 
    remoteJid: msg.key.remoteJid,
    participant: msg.key.participant,
    dataJson: JSON.stringify(msg),
  };

  await ticket.update({
    lastMessage: body || "📎 Mídia",
  });

  const newMessage = await CreateMessageService({
    messageData,
    companyId: ticket.companyId,
  });

  // DESABILITADO: Não salvar stickers automaticamente ao receber/enviar
  // Os stickers devem ser salvos apenas quando o usuário clicar explicitamente em "Salvar Sticker"
  /*
  if (mediaType === "sticker" && finalMediaUrl) {
    try {
      const Sticker = (await import("../../models/Sticker")).default;
      const { isAnimatedWebP } = await import("../../utils/webpDetector");
      const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
      
      let stickerFileName: string;
      if (finalMediaUrl.includes("/")) {
        stickerFileName = path.basename(finalMediaUrl);
      } else {
        stickerFileName = finalMediaUrl;
      }
      
      const sourceFile = path.resolve(publicFolder, `company${ticket.companyId}`, "stickers", stickerFileName);
      
      if (!fs.existsSync(sourceFile)) {
        logger.warn(`Sticker file not found: ${sourceFile} for company ${ticket.companyId}`);
      } else {
        const stickersSalvosFolder = path.join(publicFolder, `company${ticket.companyId}`, "stickers", "salvos");
        ensureFolderPermissions(stickersSalvosFolder);

        const isAnimated = await isAnimatedWebP(sourceFile);
        
        const ext = path.extname(stickerFileName).toLowerCase();
        let finalStickerFileName = stickerFileName;
        let finalDestination = path.join(stickersSalvosFolder, stickerFileName);
        
        if (isAnimated && ext !== ".webp") {
          const nameWithoutExt = path.basename(stickerFileName, ext);
          finalStickerFileName = `${nameWithoutExt}.webp`;
          finalDestination = path.join(stickersSalvosFolder, finalStickerFileName);
        }
        
        if (!fs.existsSync(finalDestination)) {
          fs.copyFileSync(sourceFile, finalDestination);
          logger.info(`Sticker copiado para galeria: ${finalStickerFileName}`);
        }
        
        const stickerPath = `stickers/salvos/${finalStickerFileName}`;

        const existingSticker = await Sticker.findOne({
          where: {
            companyId: ticket.companyId,
            path: stickerPath
          }
        });

        if (!existingSticker) {
          await Sticker.create({
            companyId: ticket.companyId,
            name: finalStickerFileName,
            path: stickerPath,
            mimetype: isAnimated ? "image/webp" : (mime.lookup(finalDestination) || "image/webp"),
            userId: null
          });
          logger.info(`Sticker salvo no banco: ${stickerPath}`);
        } else if (isAnimated && existingSticker.mimetype !== "image/webp") {
          await existingSticker.update({ mimetype: "image/webp" });
          logger.info(`Sticker atualizado para WebP animado: ${stickerPath}`);
        }
      }
    } catch (err) {
      logger.error("Erro ao salvar sticker na galeria:", err);
      Sentry.captureException(err);
    }
  }
  */

  if (!msg.key.fromMe && ticket.status === "closed") {
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" },
      ],
    });

    io.to(`company-${ticket.companyId}-closed`)
      .to(`queue-${ticket.queueId}-closed`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id,
      });

    io.to(`company-${ticket.companyId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .to(ticket.id.toString())
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id,
      });
  }

  return newMessage;
};

function getStatus(msg, msgType) {

  if (msg.status == "PENDING") {

    if (msg.key.fromMe && msgType == "reactionMessage"){
      return 3;
    }

    return 1
  } else if (msg.status == "SERVER_ACK") {
    return 1
  }
  return msg.status;
}


export const verifyMessage = async (
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact
) => {
  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  let body = getBodyMessage(msg);
  const isEdited = getTypeMessage(msg) == 'editedMessage';
  const baileysMsgType = getTypeMessage(msg);

  // IMPORTANTE: Verificar se é GIF PRIMEIRO, antes de qualquer outra coisa
  // GIFs podem vir como videoMessage com mimetype video/mp4 mas com gifPlayback: true
  // Ou podem vir como videoMessage/imageMessage com mimetype image/gif
  const videoMsg = msg.message?.videoMessage;
  const imageMsg = msg.message?.imageMessage;
  
  // Verificar se é GIF:
  // 1. Pelo mimetype image/gif
  // 2. Pela propriedade gifPlayback: true (GIFs convertidos para MP4 pelo WhatsApp)
  const isGifByMimetype = videoMsg?.mimetype === "image/gif" || imageMsg?.mimetype === "image/gif";
  const isGifByPlayback = videoMsg?.gifPlayback === true;
  const isGif = isGifByMimetype || isGifByPlayback;
  
  // Log para debug
  if (isGif || baileysMsgType === 'videoMessage' || baileysMsgType === 'imageMessage') {
    console.log("DEBUG GIF - verifyMessage:", {
      baileysMsgType,
      videoMsgMimetype: videoMsg?.mimetype,
      imageMsgMimetype: imageMsg?.mimetype,
      gifPlayback: videoMsg?.gifPlayback,
      isGifByMimetype,
      isGifByPlayback,
      isGif,
      fromMe: msg.key.fromMe
    });
  }
  
  // Verificar se forceMediaType foi passado (para GIFs e Stickers enviados)
  const forceMediaType = (msg as any).forceMediaType;
  
  // Verificar se é GIF pelo nome do arquivo (quando há mediaUrl predefinido)
  const tempMediaUrl = (msg as any).mediaUrl;
  const isGifByFilename = tempMediaUrl && typeof tempMediaUrl === 'string' && tempMediaUrl.toLowerCase().endsWith('.gif');
  
  let mediaType: string;
  
  // Prioridade 1: Verificar se é GIF (pelo mimetype ou forceMediaType ou filename)
  if (isGif || forceMediaType === "gif" || isGifByFilename) {
    mediaType = "gif";
    console.log("DEBUG GIF - verifyMessage: Definindo mediaType como 'gif'");
  } else if (forceMediaType === "sticker") {
    mediaType = "sticker";
  } else {
    // Se não é GIF, então normalizar mediaType baseado no tipo do Baileys
    mediaType = baileysMsgType;
    
    // Normalizar mediaType para o formato esperado pelo frontend
    if (mediaType === 'documentMessage' || mediaType === 'documentWithCaptionMessage') {
      // Verificar o mimetype do documento para determinar se é "document" ou "application"
      const docMsg = msg.message?.documentMessage || 
                     msg.message?.documentWithCaptionMessage?.message?.documentMessage;
      if (docMsg?.mimetype) {
        const mimeType = docMsg.mimetype.split("/")[0];
        mediaType = mimeType === "application" ? "application" : "document";
      } else {
        mediaType = "document";
      }
    } else if (mediaType === 'imageMessage') {
      mediaType = "image";
    } else if (mediaType === 'videoMessage') {
      mediaType = "video";
    } else if (mediaType === 'audioMessage' || mediaType === 'pttMessage') {
      mediaType = "audio";
    } else if (mediaType === 'stickerMessage') {
      mediaType = "sticker";
    }
  }

  // Garantir que body nunca seja null ou undefined
  if (!body || body.trim() === '') {
    if (mediaType === 'document' || mediaType === 'application') {
      body = msg.message?.documentMessage?.fileName || 
             msg.message?.documentWithCaptionMessage?.message?.documentMessage?.fileName || 
             "Documento";
    } else if (mediaType === 'image') {
      body = "📷 Imagem";
    } else if (mediaType === 'video') {
      body = "🎥 Vídeo";
    } else if (mediaType === 'audio') {
      body = "🎵 Áudio";
    } else if (mediaType === 'sticker') {
      body = "🎨 Sticker";
    } else if (mediaType === 'gif') {
      body = "GIF";
    } else {
      body = "📎 Mídia";
    }
  }

  // Extrair mediaUrl se for uma mensagem de mídia enviada
  // Quando enviamos uma mensagem, o mediaUrl pode estar no objeto sentMessage
  let mediaUrl: string | undefined = undefined;
  
  if ((mediaType === 'document' || mediaType === 'application' || mediaType === 'image' || mediaType === 'video' || mediaType === 'audio' || mediaType === 'gif' || mediaType === 'sticker') && msg.key.fromMe) {
    // Tentar obter mediaUrl do objeto msg se foi adicionado pelo SendWhatsAppMedia
    if ((msg as any).mediaUrl) {
      mediaUrl = (msg as any).mediaUrl;
      // Se for sticker e o mediaUrl não tiver o path stickers/, adicionar
      if (mediaType === 'sticker' && mediaUrl && !mediaUrl.startsWith('stickers/')) {
        mediaUrl = `stickers/${mediaUrl}`;
        console.log("DEBUG STICKER - verifyMessage: Ajustando mediaUrl para incluir path:", mediaUrl);
      }
    } else {
      // Tentar extrair do dataJson
      try {
        const docMsg = msg.message?.documentMessage || 
                       msg.message?.documentWithCaptionMessage?.message?.documentMessage;
        if (docMsg?.fileName) {
          // Para mensagens enviadas, o arquivo já foi salvo com timestamp
          // Vamos procurar o arquivo mais recente que corresponde ao fileName
          const fileName = docMsg.fileName;
          // O arquivo foi salvo como timestamp_fileName no SendWhatsAppMedia
          // Mas não temos o timestamp aqui, então vamos deixar o mediaUrl como undefined
          // e o frontend vai usar o dataJson para extrair o fileName
        }
      } catch (e) {
        // Ignora erro
      }
    }
  }

  // Log final antes de salvar
  if (mediaType === "gif" || baileysMsgType === 'videoMessage' || baileysMsgType === 'imageMessage') {
    console.log("DEBUG GIF - verifyMessage: Salvando mensagem com mediaType:", mediaType, {
      mediaUrl,
      fromMe: msg.key.fromMe
    });
  }

  const messageData = {
    id: isEdited ? msg?.message?.editedMessage?.message?.protocolMessage?.key?.id : msg.key.id,
    ticketId: ticket.id,
    contactId: msg.key.fromMe ? undefined : contact.id,
    body,
    fromMe: msg.key.fromMe,
    mediaType: mediaType,
    read: msg.key.fromMe,
    quotedMsgId: quotedMsg?.id,
    ack: msg.status || 0, // Garantir que sempre tenha um valor numérico
    remoteJid: msg.key.remoteJid,
    participant: msg.key.participant,
    dataJson: JSON.stringify(msg),
    isEdited: isEdited,
    ...(mediaUrl && { mediaUrl }),
  };

  await ticket.update({
    lastMessage: body || "📎 Mídia"
  });


  await CreateMessageService({ messageData, companyId: ticket.companyId });

  // DESABILITADO: Não salvar stickers automaticamente ao receber/enviar
  // Os stickers devem ser salvos apenas quando o usuário clicar explicitamente em "Salvar Sticker"
  /*
  if (mediaType === "sticker" && mediaUrl) {
    try {
      const Sticker = (await import("../../models/Sticker")).default;
      const { isAnimatedWebP } = await import("../../utils/webpDetector");
      const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
      
      let stickerFileName: string;
      if (mediaUrl.includes("/")) {
        stickerFileName = path.basename(mediaUrl);
      } else {
        stickerFileName = mediaUrl;
      }
      
      const sourceFile = path.resolve(publicFolder, `company${ticket.companyId}`, "stickers", stickerFileName);
      
      if (!fs.existsSync(sourceFile)) {
        logger.warn(`Sticker file not found: ${sourceFile} for company ${ticket.companyId}`);
      } else {
        const stickersSalvosFolder = path.join(publicFolder, `company${ticket.companyId}`, "stickers", "salvos");
        ensureFolderPermissions(stickersSalvosFolder);

        const isAnimated = await isAnimatedWebP(sourceFile);
        
        const ext = path.extname(stickerFileName).toLowerCase();
        let finalStickerFileName = stickerFileName;
        let finalDestination = path.join(stickersSalvosFolder, stickerFileName);
        
        if (isAnimated && ext !== ".webp") {
          const nameWithoutExt = path.basename(stickerFileName, ext);
          finalStickerFileName = `${nameWithoutExt}.webp`;
          finalDestination = path.join(stickersSalvosFolder, finalStickerFileName);
        }
        
        if (!fs.existsSync(finalDestination)) {
          fs.copyFileSync(sourceFile, finalDestination);
          logger.info(`Sticker copiado para galeria: ${finalStickerFileName}`);
        }
        
        const stickerPath = `stickers/salvos/${finalStickerFileName}`;

        const existingSticker = await Sticker.findOne({
          where: {
            companyId: ticket.companyId,
            path: stickerPath
          }
        });

        if (!existingSticker) {
          await Sticker.create({
            companyId: ticket.companyId,
            name: finalStickerFileName,
            path: stickerPath,
            mimetype: isAnimated ? "image/webp" : (mime.lookup(finalDestination) || "image/webp"),
            userId: null
          });
          logger.info(`Sticker salvo no banco: ${stickerPath}`);
        } else if (isAnimated && existingSticker.mimetype !== "image/webp") {
          await existingSticker.update({ mimetype: "image/webp" });
          logger.info(`Sticker atualizado para WebP animado: ${stickerPath}`);
        }
      }
    } catch (err) {
      logger.error("Erro ao salvar sticker na galeria:", err);
      Sentry.captureException(err);
    }
  }
  */

  if (!msg.key.fromMe && ticket.status === "closed") {
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" }
      ]
    });

    io.to(`company-${ticket.companyId}-closed`)
      .to(`queue-${ticket.queueId}-closed`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id
      });

    io.to(`company-${ticket.companyId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id
      });
  }
};

export const isValidMsg = (msg: proto.IWebMessageInfo): boolean => {
  if (msg.key.remoteJid === "status@broadcast") return false;
  try {
    const msgType = getTypeMessage(msg);
    if (!msgType) {
      return;
    }

    const ifType =
      msgType === "conversation" ||
      msgType === "extendedTextMessage" ||
      msgType === "editedMessage" ||
      msgType === "audioMessage" ||
      msgType === "videoMessage" ||
      msgType === "imageMessage" ||
      msgType === "documentMessage" ||
      msgType === "documentWithCaptionMessage" ||
      msgType === "stickerMessage" ||
      msgType === "buttonsResponseMessage" ||
      msgType === "buttonsMessage" ||
      msgType === "messageContextInfo" ||
      msgType === "locationMessage" ||
      msgType === "liveLocationMessage" ||
      msgType === "contactMessage" ||
      msgType === "voiceMessage" ||
      msgType === "mediaMessage" ||
      msgType === "contactsArrayMessage" ||
      msgType === "reactionMessage" ||
      msgType === "ephemeralMessage" ||
      msgType === "protocolMessage" ||
      msgType === "listResponseMessage" ||
      msgType === "listMessage" ||
      msgType === "viewOnceMessage";

    if (!ifType) {
      logger.warn(`#### Nao achou o type em isValidMsg: ${msgType}
${JSON.stringify(msg?.message)}`);
      Sentry.setExtra("Mensagem", { BodyMsg: msg.message, msg, msgType });
      Sentry.captureException(new Error("Novo Tipo de Mensagem em isValidMsg"));
    }

    return !!ifType;
  } catch (error) {
    Sentry.setExtra("Error isValidMsg", { msg });
    Sentry.captureException(error);
  }
};


const Push = (msg: proto.IWebMessageInfo) => {
  return msg.pushName;
}
const verifyQueue = async (
  wbot: Session,
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact,
  mediaSent?: Message | undefined
) => {
  const companyId = ticket.companyId;

  // Verificar se o ticket é de grupo e se a fila tem linkToGroup ativo
  if (ticket.isGroup && ticket.queueId) {
    const Queue = (await import("../../models/Queue")).default;
    const queue = await Queue.findByPk(ticket.queueId);
    if (queue?.linkToGroup) {
      // Se linkToGroup estiver ativo, não executar automações
      return;
    }
  }

  const { queues, greetingMessage, greetingMediaPath, greetingMediaName, maxUseBotQueues, timeUseBotQueues } = await ShowWhatsAppService(
    wbot.id!,
    ticket.companyId
  );

  // Envia mídia de saudação da conexão se houver, antes de processar filas
  // Esta variável será usada para evitar duplicação
  let greetingMediaSent = false;
  
  if (greetingMediaPath && greetingMediaPath !== "" && !msg.key.fromMe && !ticket.isGroup) {
    const lastMessage = await Message.findOne({
      where: {
        ticketId: ticket.id,
        fromMe: true
      },
      order: [["createdAt", "DESC"]]
    });

    // Verifica se já foi enviada a mídia de saudação
    const alreadySent = lastMessage && (
      lastMessage.mediaUrl?.includes("greeting") || 
      (greetingMessage && lastMessage.body?.includes(greetingMessage))
    );

    if (!alreadySent) {
      greetingMediaSent = true;
      const hasMessage = greetingMessage && greetingMessage.trim() !== "";
      const hasQueues = queues && queues.length > 0;
      // Sempre envia mídia primeiro (modo "separate")
      if (greetingMediaPath && greetingMediaPath !== "") {
        const filePath = path.resolve("public", `company${companyId}`, greetingMediaPath);
        const optionsMsg = await getMessageOptions(greetingMediaName || "imagem", filePath, companyId.toString(), "");
        if (optionsMsg) {
          const sentMediaMessage = await wbot.sendMessage(
            `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
            { ...optionsMsg }
          );
          // Adiciona mediaUrl ao sentMessage para identificar que é mídia de saudação
          if (sentMediaMessage) {
            (sentMediaMessage as any).mediaUrl = greetingMediaPath;
          }
          await verifyMediaMessage(sentMediaMessage, ticket, contact);
          await delay(500);
        }
      }
      
      // Só envia a saudação como texto separado se NÃO houver filas
      // Se houver filas, o menu será enviado depois pela função handleChartbot
      if (hasMessage && !hasQueues) {
        await delay(500);
        const sentTextMessage = await wbot.sendMessage(
          `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          {
            text: greetingMessage
          }
        );
        await verifyMessage(sentTextMessage, ticket, contact);
      }
      // Se não tem mídia mas tem mensagem e não tem filas, envia apenas o texto
      else if (hasMessage && !greetingMediaPath && !hasQueues) {
        const sentMessage = await wbot.sendMessage(
          `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          {
            text: greetingMessage
          }
        );
        await verifyMessage(sentMessage, ticket, contact);
      }
    }
  }

  if (queues.length === 1) {
    const sendGreetingMessageOneQueues = await Setting.findOne({
      where: {
        key: "sendGreetingMessageOneQueues",
        companyId: ticket.companyId
      }
    });

    if (greetingMessage && greetingMessage.length > 1 && sendGreetingMessageOneQueues?.value === "enabled" && !greetingMediaPath) {
      const body = formatBody(`${greetingMessage}`, contact);
      await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        {
          text: body
        }
      );
    }

    const firstQueue = head(queues);
    let chatbot = false;

    if (firstQueue?.options) {
      chatbot = firstQueue.options.length > 0;
    }

    if (!msg.key.fromMe && !ticket.isGroup && !isNil(queues[0]?.integrationId)) {
      const integrations = await ShowQueueIntegrationService(queues[0].integrationId, companyId);
      await handleMessageIntegration(msg, wbot, integrations, ticket);
      await ticket.update({
        useIntegration: true,
        integrationId: integrations.id
      });
    }

    if (!msg.key.fromMe && !ticket.isGroup && !isNil(queues[0]?.promptId)) {
      await handleOpenAi(msg, wbot, ticket, contact, mediaSent);
      await ticket.update({
        useIntegration: true,
        promptId: queues[0]?.promptId
      });
    }

    await UpdateTicketService({
      ticketData: { queueId: firstQueue.id, chatbot, status: "pending" },
      ticketId: ticket.id,
      companyId: ticket.companyId,
    });

    return;
  }

  const lastMessage = await Message.findOne({
    where: {
      ticketId: ticket.id,
      fromMe: true
    },
    order: [["createdAt", "DESC"]]
  });

  // REGRA PARA DESABILITAR O BOT PARA ALGUM CONTATO
  if (contact.disableBot) {
    return;
  }

  const selectedOption = getBodyMessage(msg);
  const choosenQueue = /\*\[\s*\d+\s*\]\*\s*-\s*.*/g.test(lastMessage?.body)
    ? queues[+selectedOption - 1]
    : undefined;

  const buttonActive = await Setting.findOne({
    where: {
      key: "chatBotType",
      companyId
    }
  });

  const botText = async () => {
    let options = "";
    queues.forEach((queue, index) => {
      options += `*[ ${index + 1} ]* - ${queue.name}\n`;
    });

    const textMessage = {
      text: formatBody(`\u200e${greetingMessage}\n\n${options}`, contact),
    };
    
    let lastMsg = map_msg.get(contact.number);
    let invalidOption = "Opção inválida, por favor, escolha uma opção válida.\n\n";

    if (!lastMsg?.msg || getBodyMessage(msg).includes('#') || textMessage.text === 'concluido' || lastMsg.msg !== textMessage.text && !lastMsg.invalid_option) {
      const sendMsg = await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        textMessage
      );
      lastMsg ?? (lastMsg = {});
      lastMsg.msg = textMessage.text;
      lastMsg.invalid_option = false;
      lastMsg.invalid_attempts = 0;
      map_msg.set(contact.number, lastMsg);
      await verifyMessage(sendMsg, ticket, ticket.contact);
    } else if (lastMsg.invalid_attempts < 2) {
      // Envia mensagem de erro + menu novamente (até 2 tentativas)
      textMessage.text = invalidOption + textMessage.text;
      const sendMsg = await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        textMessage
      );
      lastMsg.invalid_attempts = (lastMsg.invalid_attempts || 0) + 1;
      lastMsg.invalid_option = true;
      lastMsg.msg = textMessage.text;
      map_msg.set(contact.number, lastMsg);
      await verifyMessage(sendMsg, ticket, ticket.contact);
    } else {
      // Na 3a tentativa, seleciona automaticamente a primeira fila
      const firstQueue = head(queues);
      let chatbot = false;
      
      if (firstQueue?.options) {
        chatbot = firstQueue.options.length > 0;
      }

      await UpdateTicketService({
        ticketData: { queueId: firstQueue.id, chatbot, status: "pending" },
        ticketId: ticket.id,
        companyId: ticket.companyId,
      });

      // Envia mensagem informando a seleção automática
      const autoSelectMessage = {
        text: formatBody(`Opção selecionada automaticamente: ${firstQueue.name}`, contact),
      };
      await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        autoSelectMessage
      );
    }
  };

  if (choosenQueue) {
    let chatbot = false;
    if (choosenQueue?.options) {
      chatbot = choosenQueue.options.length > 0;
    }

    await UpdateTicketService({
      ticketData: { queueId: choosenQueue.id, chatbot },
      ticketId: ticket.id,
      companyId: ticket.companyId,
    });

    if (choosenQueue.options.length === 0) {
      const queue = await Queue.findByPk(choosenQueue.id);
      const { schedules }: any = queue;
      const now = moment();
      const weekday = now.format("dddd").toLowerCase();
      let schedule;

      if (Array.isArray(schedules) && schedules.length > 0) {
        schedule = schedules.find((s) => s.weekdayEn === weekday && s.startTimeA !== "" && s.startTimeA !== null && s.endTimeB !== "" && s.endTimeB !== null);
      }

      if (queue.outOfHoursMessage !== null && queue.outOfHoursMessage !== "" && !isNil(schedule)) {
        const startTimeA = moment(schedule.startTimeA, "HH:mm");
        const endTimeA = moment(schedule.endTimeA, "HH:mm");
        const startTimeB = schedule.startTimeB ? moment(schedule.startTimeB, "HH:mm") : null;
        const endTimeB = schedule.endTimeB ? moment(schedule.endTimeB, "HH:mm") : null;

        const isWithinBusinessHours = (now.isBetween(startTimeA, endTimeA, null, '[]') || (startTimeB && endTimeB && now.isBetween(startTimeB, endTimeB, null, '[]')));

        if (!isWithinBusinessHours) {
          if (ticket.status === "open" || ticket.status === "pendent" || ticket.status === "assigned") {
            const body = formatBody(`\u200e${queue.outOfHoursMessage}`, ticket.contact);
            const sentMessage = await wbot.sendMessage(
              `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
              text: body,
            });
            await verifyMessage(sentMessage, ticket, contact);

            await UpdateTicketService({
              ticketData: { status: "closed", queueId: null, chatbot },
              ticketId: ticket.id,
              companyId: ticket.companyId,
            });

            const finalizationMessage = "Seu ticket foi finalizado porque estamos *Offline* no momento.";
            await wbot.sendMessage(
              `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
              text: finalizationMessage,
            });
          }
        } else if (ticket.status === "assigned") {
          return;
        }
      }
    }

    if (!msg.key.fromMe && !ticket.isGroup && choosenQueue.integrationId) {
      const integrations = await ShowQueueIntegrationService(choosenQueue.integrationId, companyId);
      await handleMessageIntegration(msg, wbot, integrations, ticket);
      await ticket.update({
        useIntegration: true,
        integrationId: integrations.id
      });
    }

    if (!msg.key.fromMe && !ticket.isGroup && !isNil(choosenQueue?.promptId)) {
      await handleOpenAi(msg, wbot, ticket, contact, mediaSent);
      await ticket.update({
        useIntegration: true,
        promptId: choosenQueue?.promptId
      });
    }

  {/* A DUPLICAÇÃO OCORRIA AQUI 
    
    const body = formatBody(`\u200e${choosenQueue.greetingMessage}`, ticket.contact);
    if (choosenQueue.greetingMessage) {
      const sentMessage = await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
        text: body,
      });
      await verifyMessage(sentMessage, ticket, contact);
    }

    */}

        // Só envia saudação da fila se não foi enviada mídia de saudação da conexão
        const whatsapp = await ShowWhatsAppService(wbot.id!, ticket.companyId);
        const lastMessage = await Message.findOne({
          where: {
            ticketId: ticket.id,
            fromMe: true
          },
          order: [["createdAt", "DESC"]]
        });

        // Verifica se já foi enviada mídia de saudação da conexão
        // Procura por "greeting" no mediaUrl ou verifica se o caminho contém "greeting"
        const greetingMediaAlreadySent = whatsapp.greetingMediaPath && 
          whatsapp.greetingMediaPath !== "" &&
          (lastMessage?.mediaUrl?.includes("greeting") || 
           lastMessage?.mediaUrl?.includes(whatsapp.greetingMediaPath) ||
           (lastMessage?.mediaType && lastMessage.mediaType !== "text" && 
            lastMessage.createdAt && 
            new Date().getTime() - new Date(lastMessage.createdAt).getTime() < 5000)); // Mensagem de mídia enviada nos últimos 5 segundos

        // Não envia saudação da fila se já foi enviada mídia de saudação da conexão
        if (choosenQueue.greetingMessage && !greetingMediaAlreadySent) {
          const body = formatBody(`\u200e${choosenQueue.greetingMessage}`, ticket.contact);
          const sentMessage = await wbot.sendMessage(
            `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
            { text: body }
          );
          await verifyMessage(sentMessage, ticket, contact);
        }


    if (choosenQueue.mediaPath !== null && choosenQueue.mediaPath !== "") {
      const filePath = path.resolve("public", `company${companyId}`,choosenQueue.mediaPath);
      const optionsMsg = await getMessageOptions(choosenQueue.mediaName, filePath, null, ticket.companyId.toString());
      let sentMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, { ...optionsMsg });
      await verifyMediaMessage(sentMessage, ticket, contact);
    }
  } else {
    if (maxUseBotQueues && maxUseBotQueues !== 0 && ticket.amountUsedBotQueues >= maxUseBotQueues) {
      return;
    }

    const ticketTraking = await FindOrCreateATicketTrakingService({ ticketId: ticket.id, companyId });
    let dataLimite = new Date();
    let Agora = new Date();

    if (ticketTraking.chatbotAt !== null) {
      dataLimite.setMinutes(ticketTraking.chatbotAt.getMinutes() + (Number(timeUseBotQueues)));

      if (ticketTraking.chatbotAt !== null && Agora < dataLimite && timeUseBotQueues !== "0" && ticket.amountUsedBotQueues !== 0) {
        return;
      }
    }
    await ticketTraking.update({
      chatbotAt: null
    });

    if (buttonActive.value === "text") {
      return botText();
    }
  }
};


export const verifyRating = (ticketTraking: TicketTraking) => {
  if (
    ticketTraking &&
    ticketTraking.finishedAt === null &&
    ticketTraking.userId !== null &&
    ticketTraking.ratingAt !== null
  ) {
    return true;
  }
  return false;
};

export const handleRating = async (
  rate: number,
  ticket: Ticket,
  ticketTraking: TicketTraking,
  contact: Contact
) => {
  const io = getIO();

  const { complationMessage } = await ShowWhatsAppService(
    ticket.whatsappId,
    ticket.companyId
  );

  let finalRate = rate;

  if (rate < 1) {
    finalRate = 1;
  }
  if (rate > 5) {
    finalRate = 5;
  }

  await UserRating.create({
    ticketId: ticketTraking.ticketId,
    companyId: ticketTraking.companyId,
    userId: ticketTraking.userId,
    rate: finalRate,
  });

  if (complationMessage) {
    const body = formatBody(`\u200e${complationMessage}`, ticket.contact);
    const msg = await SendWhatsAppMessage({ body, ticket });
    await verifyMessage(msg, ticket, contact);
  }

  await ticketTraking.update({
    finishedAt: moment().toDate(),
    rated: true,
  });

  // Manter a fila no ticket ao fechá-lo
  await ticket.update({
    // Remover esses campos, já que queremos manter a fila
    queueOptionId: null,
    userId: null,
    status: "closed", 
    // Não removemos queueId, pois a fila deve ser mantida
  });

  io.to(`company-${ticket.companyId}-open`)
    .to(`queue-${ticket.queueId}-open`)
    .emit(`company-${ticket.companyId}-ticket`, {
      action: "delete",
      ticket,
      ticketId: ticket.id,
    });

  io.to(`company-${ticket.companyId}-${ticket.status}`)
    .to(`queue-${ticket.queueId}-${ticket.status}`)
    .to(ticket.id.toString())
    .emit(`company-${ticket.companyId}-ticket`, {
      action: "update",
      ticket,
      ticketId: ticket.id,
    });
};


const handleChartbot = async (ticket: Ticket, msg: proto.IWebMessageInfo, wbot: Session, dontReadTheFirstQuestion = false) => {
  // Verificar se o ticket é de grupo e se a fila tem linkToGroup ativo
  if (ticket.isGroup && ticket.queueId) {
    const queue = await Queue.findByPk(ticket.queueId);
    if (queue?.linkToGroup) {
      // Se linkToGroup estiver ativo, não executar chatbot
      return;
    }
  }

  const queue = await Queue.findByPk(ticket.queueId, {
    include: [
      {
        model: QueueOption,
        as: "options",
        where: { parentId: null },
      },
    ],
    order: [
      ["options", "option", "ASC"],
    ]
  });



  const messageBody = getBodyMessage(msg);


  if (!isNil(queue) && !isNil(ticket.queueOptionId) && messageBody == "#") {
    // falar com atendente
    await ticket.update({ queueOptionId: null, chatbot: false });
    const sentMessage = await wbot.sendMessage(
      `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        text: "\u200eAguarde, você será atendido em instantes."
      }
    );
    await verifyMessage(sentMessage, ticket, ticket.contact);
    return;
  } else if (!isNil(queue) && !isNil(ticket.queueOptionId) && messageBody == "0") {
    // voltar para o menu anterior
    const option = await QueueOption.findByPk(ticket.queueOptionId);
    await ticket.update({ queueOptionId: option?.parentId });

    // escolheu uma opção
  } else if (!isNil(queue) && !isNil(ticket.queueOptionId)) {


    const count = await QueueOption.count({
      where: { parentId: ticket.queueOptionId },
    });
    let option: any = {};
    if (count == 1) {
      option = await QueueOption.findOne({
        where: { parentId: ticket.queueOptionId },
      });
    } else {
      option = await QueueOption.findOne({
        where: {
          option: messageBody || "",
          parentId: ticket.queueOptionId,
        },
      });
    }
    if (option) {
      await ticket.update({ queueOptionId: option?.id });
    }

    // não linha a primeira pergunta
  } else if (!isNil(queue) && isNil(ticket.queueOptionId) && !dontReadTheFirstQuestion) {
    const option = queue?.options.find((o) => o.option == messageBody);
    if (option) {
      await ticket.update({ queueOptionId: option?.id });
    }
  }

  await ticket.reload();

  if (!isNil(queue) && isNil(ticket.queueOptionId)) {


    const queueOptions = await QueueOption.findAll({
      where: { queueId: ticket.queueId, parentId: null },
      order: [
        ["option", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    const companyId = ticket.companyId;

    const buttonActive = await Setting.findOne({
      where: {
        key: "chatBotType",
        companyId
      }
    });

    // const botList = async () => {
    // const sectionsRows = [];

    // queues.forEach((queue, index) => {
    //   sectionsRows.push({
    //     title: queue.name,
    //     rowId: `${index + 1}`
    //   });
    // });

    // const sections = [
    //   {
    //     rows: sectionsRows
    //   }
    // ];


    //   const listMessage = {
    //     text: formatBody(`\u200e${queue.greetingMessage}`, ticket.contact),
    //     buttonText: "Escolha uma opção",
    //     sections
    //   };

    //   const sendMsg = await wbot.sendMessage(
    //     `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
    //     listMessage
    //   );

    //   await verifyMessage(sendMsg, ticket, ticket.contact);
    // }

    const botButton = async () => {
      // Verifica se já foi enviada mídia de saudação da conexão
      const whatsapp = await ShowWhatsAppService(ticket.whatsappId, ticket.companyId);
      const lastMessage = await Message.findOne({
        where: {
          ticketId: ticket.id,
          fromMe: true
        },
        order: [["createdAt", "DESC"]]
      });

      // Verifica se já foi enviada mídia de saudação da conexão
      // Procura por "greeting" no mediaUrl ou verifica se o caminho contém "greeting"
      const greetingMediaAlreadySent = whatsapp.greetingMediaPath && 
        whatsapp.greetingMediaPath !== "" &&
        (lastMessage?.mediaUrl?.includes("greeting") || 
         lastMessage?.mediaUrl?.includes(whatsapp.greetingMediaPath) ||
         (lastMessage?.mediaType && lastMessage.mediaType !== "text" && 
          lastMessage.createdAt && 
          new Date().getTime() - new Date(lastMessage.createdAt).getTime() < 5000)); // Mensagem de mídia enviada nos últimos 5 segundos

      const buttons = [];
      queueOptions.forEach((option, i) => {
        buttons.push({
          buttonId: `${option.option}`,
          buttonText: { displayText: option.title },
          type: 4
        });
      });
      buttons.push({
        buttonId: `#`,
        buttonText: { displayText: "Menu inicial *[ 0 ]* Menu anterior" },
        type: 4
      });

      // Se já foi enviada mídia de saudação da conexão, não inclui saudação da fila
      const buttonText = greetingMediaAlreadySent ? "" : formatBody(`\u200e${queue.greetingMessage}`, ticket.contact);

      const buttonMessage = {
        text: buttonText,
        buttons,
        headerType: 4
      };

      const sendMsg = await wbot.sendMessage(
        `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        buttonMessage
      );

      await verifyMessage(sendMsg, ticket, ticket.contact);
    }

    const botText = async () => {
      let options = "";

      queueOptions.forEach((option, i) => {
        options += `*[ ${option.option} ]* - ${option.title}\n`;
      });
      //options += `\n*[ 0 ]* - Menu anterior`;
      options += `\n*[ # ]* - Menu inicial`;

    // const textMessage = {
    //  text: formatBody(`\u200e${queue.greetingMessage}\n\n${options}`, ticket.contact),
    //};

     const textMessage = {
        text: formatBody(`\u200e${options}`, ticket.contact),
      }; //FOI REMOVIDO O ${queue.greetingMessage} COMO NO COMENTARIO ACIMA//


      console.log('textMessage5555555555555', textMessage)
      const sendMsg = await wbot.sendMessage(
        `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        textMessage
      );

      await verifyMessage(sendMsg, ticket, ticket.contact);
    };

    // if (buttonActive.value === "list") {
    //   return botList();
    // };

    if (buttonActive.value === "button" && QueueOption.length <= 4) {
      return botButton();
    }

    if (buttonActive.value === "text") {
      return botText();
    }

    if (buttonActive.value === "button" && QueueOption.length > 4) {
      return botText();
    }
  } else if (!isNil(queue) && !isNil(ticket.queueOptionId)) {
    const currentOption = await QueueOption.findByPk(ticket.queueOptionId);
    const queueOptions = await QueueOption.findAll({
      where: { parentId: ticket.queueOptionId },
      order: [
        ["option", "ASC"],
        ["createdAt", "ASC"],
      ],
    });
	
	if (queueOptions.length === 0) {
		const textMessage = {
			text: formatBody(`${currentOption.message}`, ticket.contact),
		};

		// Não envia mensagem se for tipo n8n
		if (currentOption.queueType !== "n8n") {
			const sendMsgX = await wbot.sendMessage(
				`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
				textMessage
			);
			await verifyMessage(sendMsgX, ticket, ticket.contact);
		}

		// Envia mídia se houver
		if (currentOption.mediaPath !== null && currentOption.mediaPath !== "") {
			const filePath = path.resolve("public", "company" + ticket.companyId, currentOption.mediaPath);
			const optionsMsg = await getMessageOptions(currentOption.mediaName, filePath, textMessage.text, ticket.companyId.toString());
			let sentMessage = await wbot.sendMessage(
				`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
				{ ...optionsMsg }
			);
			await verifyMediaMessage(sentMessage, ticket, ticket.contact);
		}

		// Verifica posição na fila se necessário
		const count = await Ticket.findAndCountAll({
			where: {
				userId: null,
				status: "pending",
				companyId: ticket.companyId,
				queueId: currentOption.queueOptionsId,
				isGroup: false
			}
		});

		let queuePosition = await Setting.findOne({
			where: {
				key: "sendQueuePosition",
				companyId: ticket.companyId
			}
		});

		const lastMessageFromMe = await Message.findOne({
			where: {
				ticketId: ticket.id,
				fromMe: true,
				body: textMessage.text
			},
			order: [["createdAt", "DESC"]]
		});

		const io = getIO();

		// Verifica se é tipo queue ou attendant para processar automação
		if (currentOption.queueType === "queue" || currentOption.queueType === "attendent") {
			// Tratamento para envio de mensagem quando a fila está fora do expediente
			const queueC = await Queue.findByPk(currentOption.queueOptionsId);
			if (queueC) {
				const { schedules }: any = queueC;
				const now = moment();
				const weekday = now.format("dddd").toLowerCase();
				let scheduleC;
				if (Array.isArray(schedules) && schedules.length > 0) {
					scheduleC = schedules.find((s) => s.weekdayEn === weekday && s.startTime !== "" && s.startTime !== null && s.endTime !== "" && s.endTime !== null);
				}

				if (queueC.outOfHoursMessage !== null && queueC.outOfHoursMessage !== "" && !isNil(scheduleC)) {
					const startTime = moment(scheduleC.startTime, "HH:mm");
					const endTime = moment(scheduleC.endTime, "HH:mm");

					if (now.isBefore(startTime) || now.isAfter(endTime)) {
						const body = formatBody(`${queueC.outOfHoursMessage}\n\n*SAIR* - Encerrar Atendimento`, ticket.contact);
						const sentMessage = await wbot.sendMessage(
							`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
							{ text: body }
						);
						await verifyMessage(sentMessage, ticket, ticket.contact);

						const outsidemessageActive = await Setting.findOne({
							where: {
								key: "outsidemessage",
								companyId: ticket.companyId
							}
						});

						if (outsidemessageActive?.value === "disabled") {
							logger.info("MENSAGEM ENVIADA FORA DO HORÁRIO - SEM ABRIR TICKET");
							await UpdateTicketService({
								ticketData: { queueId: null, chatbot: null },
								ticketId: ticket.id,
								companyId: ticket.companyId,
							});
							return;
						}
					}
				} else {
					// Envia posição na fila se configurado
					if (queuePosition?.value === "enabled" && !queueOptions.length) {
						const qtd = count.count === 0 ? 1 : count.count;
						const msgFila = `*Assistente Virtual:*\n{{ms}} *{{name}}*, sua posição na fila de atendimento é: *${qtd}*`;
						const bodyFila = formatBody(`${msgFila}`, ticket.contact);
						const debouncedSentMessagePosicao = debounce(
							async () => {
								await wbot.sendMessage(
									`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
									{ text: bodyFila }
								);
							},
							3000,
							ticket.id
						);
						debouncedSentMessagePosicao();
					}
				}
			}
		}

		// Processa automação baseada no tipo
		if (lastMessageFromMe) {
			// Se já enviou a mensagem, apenas atualiza o ticket
			const oldStatus = ticket.status;
			const oldQueueId = ticket.queueId;
			const oldUserId = ticket.userId;

			if (currentOption.queueType === "queue") {
				await ticket.update({
					queueId: currentOption.queueOptionsId,
					queueOptionId: currentOption.parentId,
					chatbot: false,
					status: "pending"
				});
				await ticket.reload({
					include: [
						{ model: Queue, as: "queue" },
						{ model: User, as: "user" },
						{ model: Contact, as: "contact" },
					],
				});

				// Emite eventos do socket
				io.to(`company-${ticket.companyId}-${oldStatus}`)
					.to(`queue-${oldQueueId}-${oldStatus}`)
					.emit(`company-${ticket.companyId}-ticket`, {
						action: "delete",
						ticketId: ticket.id
					});

				io.to(`company-${ticket.companyId}-pending`)
					.to(`company-${ticket.companyId}-notification`)
					.to(`queue-${ticket.queueId}-pending`)
					.to(`queue-${ticket.queueId}-notification`)
					.to(ticket.id.toString())
					.emit(`company-${ticket.companyId}-ticket`, {
						action: "update",
						ticket
					});
			}

		if (currentOption.queueType === "attendent") {
			// Salva valores antigos antes de atualizar
			const oldStatus = ticket.status;
			const oldQueueId = ticket.queueId;
			const oldUserId = ticket.userId;

			// Verifica se está em recesso e se o fluxo de filas está habilitado
			const holidayPeriodEnabled = await Setting.findOne({
				where: {
					companyId: ticket.companyId,
					key: "holidayPeriodEnabled",
					value: "enabled"
				}
			});

			const holidayPeriodAllowQueueFlow = await Setting.findOne({
				where: {
					companyId: ticket.companyId,
					key: "holidayPeriodAllowQueueFlow",
					value: "enabled"
				}
			});

			// Verifica se há um período de recesso ativo
			const todayStr = moment().format("YYYY-MM-DD");
			const activeHolidayPeriod = await HolidayPeriod.findOne({
				where: {
					whatsappId: wbot.id!,
					companyId: ticket.companyId,
					active: true,
					startDate: {
						[Op.lte]: todayStr
					},
					endDate: {
						[Op.gte]: todayStr
					}
				}
			});

			// Se estiver em recesso e a opção "Mesmo com recesso fila funciona" estiver habilitada,
			// atribui apenas a fila, mas não o atendente
			const isHolidayPeriodWithQueueFlow = holidayPeriodEnabled && holidayPeriodAllowQueueFlow && activeHolidayPeriod;
			
			if (isHolidayPeriodWithQueueFlow) {
				await ticket.update({
					queueId: currentOption.queueOptionsId,
					queueOptionId: currentOption.parentId,
					chatbot: false,
					status: "pending" // Mantém como pending ao invés de open
				});
			} else {
				// Comportamento normal: atribui atendente e fila
				await ticket.update({
					userId: currentOption.queueUsersId,
					queueId: currentOption.queueOptionsId,
					queueOptionId: currentOption.parentId,
					chatbot: false,
					status: "open"
				});
			}
			await ticket.reload({
				include: [
					{ model: Queue, as: "queue" },
					{ model: User, as: "user" },
					{ model: Contact, as: "contact" },
				],
			});

			// Emite eventos do socket
			io.to(`company-${ticket.companyId}-${oldStatus}`)
				.to(`queue-${oldQueueId}-${oldStatus}`)
				.emit(`company-${ticket.companyId}-ticket`, {
					action: "delete",
					ticketId: ticket.id
				});

			// Se não estiver em recesso, também emite para o usuário antigo
			if (!isHolidayPeriodWithQueueFlow && oldUserId) {
				io.to(`user-${oldUserId}`)
					.emit(`company-${ticket.companyId}-ticket`, {
						action: "delete",
						ticketId: ticket.id
					});
			}

			// Emite evento de atualização
			const newStatus = isHolidayPeriodWithQueueFlow ? "pending" : "open";
			io.to(`company-${ticket.companyId}-${newStatus}`)
				.to(`company-${ticket.companyId}-notification`)
				.to(`queue-${ticket.queueId}-${newStatus}`)
				.to(`queue-${ticket.queueId}-notification`)
				.to(ticket.id.toString())
				.emit(`company-${ticket.companyId}-ticket`, {
					action: "update",
					ticket
				});

			// Se não estiver em recesso e tiver userId, emite para o atendente
			if (!isHolidayPeriodWithQueueFlow && ticket.userId) {
				io.to(`user-${ticket.userId}`)
					.emit(`company-${ticket.companyId}-ticket`, {
						action: "update",
						ticket
					});
			}
			}

			if (currentOption.queueType === "n8n") {
				const axios = require("axios");
				var postwebhook = {
					method: 'POST',
					url: textMessage.text,
					data: {
						mensagem: getBodyMessage(msg),
						sender: ticket.contact.number,
						chamadoId: ticket.id,
						acao: 'n8n',
						companyId: ticket.companyId,
						defaultWhatsapp_x: wbot.id,
						fromMe: msg.key.fromMe,
						queueId: ticket.queueId
					}
				};
				axios.request(postwebhook);
				logger.info("WEBHOOK POST EXEC N8N");
				return;
			}

			// Se não for nenhum tipo de automação (text ou null), desativa o chatbot
			if (!currentOption.queueType || currentOption.queueType === "text") {
				await ticket.update({
					queueOptionId: null,
					chatbot: false
				});
			}

			return;
		}

		// Atualiza ticket baseado no tipo de automação
		const oldStatus = ticket.status;
		const oldQueueId = ticket.queueId;
		const oldUserId = ticket.userId;

		if (currentOption.queueType === "queue") {
			await ticket.update({
				queueId: currentOption.queueOptionsId,
				queueOptionId: currentOption.parentId,
				chatbot: false,
				status: "pending"
			});
			await ticket.reload({
				include: [
					{ model: Queue, as: "queue" },
					{ model: User, as: "user" },
					{ model: Contact, as: "contact" },
				],
			});

			// Emite eventos do socket
			io.to(`company-${ticket.companyId}-${oldStatus}`)
				.to(`queue-${oldQueueId}-${oldStatus}`)
				.emit(`company-${ticket.companyId}-ticket`, {
					action: "delete",
					ticketId: ticket.id
				});

			io.to(`company-${ticket.companyId}-pending`)
				.to(`company-${ticket.companyId}-notification`)
				.to(`queue-${ticket.queueId}-pending`)
				.to(`queue-${ticket.queueId}-notification`)
				.to(ticket.id.toString())
				.emit(`company-${ticket.companyId}-ticket`, {
					action: "update",
					ticket
				});
		}

		if (currentOption.queueType === "attendent") {
			// Salva valores antigos antes de atualizar
			const oldStatus = ticket.status;
			const oldQueueId = ticket.queueId;
			const oldUserId = ticket.userId;

			// Verifica se está em recesso e se o fluxo de filas está habilitado
			const holidayPeriodEnabled = await Setting.findOne({
				where: {
					companyId: ticket.companyId,
					key: "holidayPeriodEnabled",
					value: "enabled"
				}
			});

			const holidayPeriodAllowQueueFlow = await Setting.findOne({
				where: {
					companyId: ticket.companyId,
					key: "holidayPeriodAllowQueueFlow",
					value: "enabled"
				}
			});

			// Verifica se há um período de recesso ativo
			const todayStr = moment().format("YYYY-MM-DD");
			const activeHolidayPeriod = await HolidayPeriod.findOne({
				where: {
					whatsappId: wbot.id!,
					companyId: ticket.companyId,
					active: true,
					startDate: {
						[Op.lte]: todayStr
					},
					endDate: {
						[Op.gte]: todayStr
					}
				}
			});

			// Se estiver em recesso e a opção "Mesmo com recesso fila funciona" estiver habilitada,
			// atribui apenas a fila, mas não o atendente
			const isHolidayPeriodWithQueueFlow = holidayPeriodEnabled && holidayPeriodAllowQueueFlow && activeHolidayPeriod;
			
			if (isHolidayPeriodWithQueueFlow) {
				await ticket.update({
					queueId: currentOption.queueOptionsId,
					queueOptionId: currentOption.parentId,
					chatbot: false,
					status: "pending" // Mantém como pending ao invés de open
				});
			} else {
				// Comportamento normal: atribui atendente e fila
				await ticket.update({
					userId: currentOption.queueUsersId,
					queueId: currentOption.queueOptionsId,
					queueOptionId: currentOption.parentId,
					chatbot: false,
					status: "open"
				});
			}
			await ticket.reload({
				include: [
					{ model: Queue, as: "queue" },
					{ model: User, as: "user" },
					{ model: Contact, as: "contact" },
				],
			});

			// Emite eventos do socket
			io.to(`company-${ticket.companyId}-${oldStatus}`)
				.to(`queue-${oldQueueId}-${oldStatus}`)
				.emit(`company-${ticket.companyId}-ticket`, {
					action: "delete",
					ticketId: ticket.id
				});

			// Se não estiver em recesso, também emite para o usuário antigo
			if (!isHolidayPeriodWithQueueFlow && oldUserId) {
				io.to(`user-${oldUserId}`)
					.emit(`company-${ticket.companyId}-ticket`, {
						action: "delete",
						ticketId: ticket.id
					});
			}

			// Emite evento de atualização
			const newStatus = isHolidayPeriodWithQueueFlow ? "pending" : "open";
			io.to(`company-${ticket.companyId}-${newStatus}`)
				.to(`company-${ticket.companyId}-notification`)
				.to(`queue-${ticket.queueId}-${newStatus}`)
				.to(`queue-${ticket.queueId}-notification`)
				.to(ticket.id.toString())
				.emit(`company-${ticket.companyId}-ticket`, {
					action: "update",
					ticket
				});

			// Se não estiver em recesso e tiver userId, emite para o atendente
			if (!isHolidayPeriodWithQueueFlow && ticket.userId) {
				io.to(`user-${ticket.userId}`)
					.emit(`company-${ticket.companyId}-ticket`, {
						action: "update",
						ticket
					});
			}
		}

		if (currentOption.queueType === "n8n") {
			const axios = require("axios");
			var postwebhook = {
				method: 'POST',
				url: textMessage.text,
				data: {
					mensagem: getBodyMessage(msg),
					sender: ticket.contact.number,
					chamadoId: ticket.id,
					acao: 'n8n',
					companyId: ticket.companyId,
					defaultWhatsapp_x: wbot.id,
					fromMe: msg.key.fromMe,
					queueId: ticket.queueId
				}
			};
			axios.request(postwebhook);
			logger.info("WEBHOOK POST EXEC N8N");
			return;
		}

		// Se não for nenhum tipo de automação (text ou null), desativa o chatbot
		if (!currentOption.queueType || currentOption.queueType === "text") {
			await ticket.update({
				queueOptionId: null,
				chatbot: false
			});
		}

		return;
	}

    if (queueOptions.length > -1) {

      const companyId = ticket.companyId;
      const buttonActive = await Setting.findOne({
        where: {
          key: "chatBotType",
          companyId
        }
      });

      const botList = async () => {
        const sectionsRows = [];

        queueOptions.forEach((option, i) => {
          sectionsRows.push({
            title: option.title,
            rowId: `${option.option}`
          });
        });
        sectionsRows.push({
          title: "Menu inicial *[ 0 ]* Menu anterior",
          rowId: `#`
        });
        const sections = [
          {
            rows: sectionsRows
          }
        ];

        const listMessage = {
          text: formatBody(`\u200e${currentOption.message}`, ticket.contact),
          buttonText: "Escolha uma opção",
          sections
        };

        const sendMsg = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          listMessage
        );

        await verifyMessage(sendMsg, ticket, ticket.contact);
      }

      const botButton = async () => {
        const buttons = [];
        queueOptions.forEach((option, i) => {
          buttons.push({
            buttonId: `${option.option}`,
            buttonText: { displayText: option.title },
            type: 4
          });
        });
        buttons.push({
          buttonId: `#`,
          buttonText: { displayText: "Menu inicial *[ 0 ]* Menu anterior" },
          type: 4
        });

        const buttonMessage = {
          text: formatBody(`\u200e${currentOption.message}`, ticket.contact),
          buttons,
          headerType: 4
        };

        const sendMsg = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          buttonMessage
        );

        await verifyMessage(sendMsg, ticket, ticket.contact);
      }

      const botText = async () => {

        let options = "";

        queueOptions.forEach((option, i) => {
          options += `*[ ${option.option} ]* - ${option.title}\n`;
        });
        options += `\n*[ 0 ]* - Menu anterior`;
        options += `\n*[ # ]* - Menu inicial`;
        const textMessage = {
          text: formatBody(`\u200e${currentOption.message}\n\n${options}`, ticket.contact),
        };

        console.log('textMessage6666666666', textMessage)
        const sendMsg = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          textMessage
        );

        await verifyMessage(sendMsg, ticket, ticket.contact);
		        if (currentOption.mediaPath !== null && currentOption.mediaPath !== "")  {

              const filePath = path.resolve("public", "company" + ticket.companyId, currentOption.mediaPath);


              const optionsMsg = await getMessageOptions(currentOption.mediaName, filePath, textMessage.text, ticket.companyId.toString());

          let sentMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, { ...optionsMsg });

          await verifyMediaMessage(sentMessage, ticket, ticket.contact);
        }
      };

      if (buttonActive.value === "list") {
        return botList();
      };

      if (buttonActive.value === "button" && QueueOption.length <= 4) {
        return botButton();
      }

      if (buttonActive.value === "text") {
        return botText();
      }

      if (buttonActive.value === "button" && QueueOption.length > 4) {
        return botText();
      }
    }
  }
}

export const handleMessageIntegration = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  queueIntegration: QueueIntegrations,
  ticket: Ticket
): Promise<void> => {
  const msgType = getTypeMessage(msg);

  if (queueIntegration.type === "n8n" || queueIntegration.type === "webhook") {
    if (queueIntegration?.urlN8N) {
      const options = {
        method: "POST",
        url: queueIntegration?.urlN8N,
        headers: {
          "Content-Type": "application/json"
        },
        json: msg
      };
      try {
        request(options, function (error, response) {
          if (error) {
            throw new Error(error);
          }
          else {
            console.log(response.body);
          }
        });
      } catch (error) {
        throw new Error(error);
      }
    }

  } else if (queueIntegration.type === "typebot") {
    console.log("entrou no typebot")
    // await typebots(ticket, msg, wbot, queueIntegration);
    await typebotListener({ ticket, msg, wbot, typebot: queueIntegration });

  }
}

const handleMessage = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  companyId: number
): Promise<void> => {
  let mediaSent: Message | undefined;

  if (!isValidMsg(msg)) return;
  try {
    let msgContact: IMe;
    let groupContact: Contact | undefined;
    
    // Executar unificação de contatos duplicados periodicamente (a cada 1000 mensagens)
    const messageCount = await Message.count({ where: { companyId } });
    if (messageCount % 1000 === 0) {
      await unifyDuplicateContacts(companyId);
    }

    const isGroup = msg.key.remoteJid?.endsWith("@g.us");

    const msgIsGroupBlock = await Setting.findOne({
      where: {
        companyId,
        key: "CheckMsgIsGroup"
      }
    });

    const bodyMessage = getBodyMessage(msg);
    const msgType = getTypeMessage(msg);

    const hasMedia =
      msg.message?.audioMessage ||
      msg.message?.imageMessage ||
      msg.message?.videoMessage ||
      msg.message?.documentMessage ||
      msg.message?.documentWithCaptionMessage ||
      msg.message?.stickerMessage ||
      msg.message?.locationMessage ||
      msg.message?.liveLocationMessage;
    if (msg.key.fromMe) {
      if (/\u200e/.test(bodyMessage)) return;

      if (
        !hasMedia &&
        msgType !== "conversation" &&
        msgType !== "extendedTextMessage" &&
        msgType !== "vcard"
      )
        return;
    }

    msgContact = await getContactMessage(msg, wbot);
    console.log('msgContact:::', msgContact)

    if (msgIsGroupBlock?.value === "enabled" && isGroup) return;

    if (isGroup) {
      groupContact = await wbotMutex.runExclusive(async () => {
        let result = groupContactCache.get(msg.key.remoteJid);
        if (!result) {
          const groupMetadata = await wbot.groupMetadata(msg.key.remoteJid);
          const msgGroupContact = {
            id: groupMetadata.id,
            name: groupMetadata.subject,
            lid: msgContact.lid,
          }
          result = await verifyContact(msgGroupContact, wbot, companyId);
          groupContactCache.set(msg.key.remoteJid, result);
        }
        return result;
      });      
    }

    const whatsapp = await ShowWhatsAppService(wbot.id!, companyId);
    console.log('msgContact2:::', msgContact)
    console.log('groupContact:::', groupContact)
    const contact = await verifyContact(msgContact, wbot, companyId);
    
    // Log para monitorar normalização
    const originalJid = msgContact.id;
    const normalizedJid = contact.number;
    if (originalJid !== normalizedJid) {
      logger.info(`JID normalizado: ${originalJid} -> ${normalizedJid}`);
    }

    let unreadMessages = 0;


    if (msg.key.fromMe) {
      await cacheLayer.set(`contacts:${contact.id}:unreads`, "0");
    } else {
      const unreads = await cacheLayer.get(`contacts:${contact.id}:unreads`);
      unreadMessages = +unreads + 1;
      await cacheLayer.set(
        `contacts:${contact.id}:unreads`,
        `${unreadMessages}`
      );
    }

    const lastMessage = await Message.findOne({
      where: {
        contactId: contact.id,
        companyId,
      },
      order: [["createdAt", "DESC"]],
    });
    

    if (unreadMessages === 0 && whatsapp.complationMessage && formatBody(whatsapp.complationMessage, contact).trim().toLowerCase() === lastMessage?.body.trim().toLowerCase()) {
      return;
    }
    

    const ticket = await FindOrCreateTicketService(contact, wbot.id!, unreadMessages, companyId, groupContact);

    // Verifica se está em período de recesso/feriado ANTES de processar qualquer coisa
    if (!msg.key.fromMe && !ticket.isGroup) {
      // Verifica primeiro se "Mesmo com recesso fila funciona" está ativo
      const holidayPeriodAllowQueueFlow = await Setting.findOne({
        where: {
          companyId,
          key: "holidayPeriodAllowQueueFlow",
          value: "enabled"
        }
      });

      // Verifica se "Ativar/Desativar mensagem de recesso/feriados" está habilitado
      const holidayPeriodEnabled = await Setting.findOne({
        where: {
          companyId,
          key: "holidayPeriodEnabled",
          value: "enabled"
        }
      });

      // Se "Mesmo com recesso fila funciona" está ativo MAS "Ativar/Desativar mensagem de recesso/feriados" está desativado,
      // não processa nenhuma automação
      if (holidayPeriodAllowQueueFlow && !holidayPeriodEnabled) {
        return; // Não processa nada quando a função está ativa mas o recesso está desativado
      }

      // Se "Ativar/Desativar mensagem de recesso/feriados" está habilitado, verifica período ativo
      if (holidayPeriodEnabled) {
        // Usa string YYYY-MM-DD para comparar com DATEONLY
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const activeHolidayPeriod = await HolidayPeriod.findOne({
          where: {
            whatsappId: wbot.id!,
            companyId,
            active: true,
            startDate: {
              [Op.lte]: todayStr
            },
            endDate: {
              [Op.gte]: todayStr
            }
          }
        });

        if (activeHolidayPeriod) {
          // Verifica se já foi enviada mensagem de recesso no intervalo configurado
          const repeatIntervalHours = activeHolidayPeriod.repeatIntervalHours || 24;
          const now = new Date();
          const intervalStart = new Date(now.getTime() - (repeatIntervalHours * 60 * 60 * 1000));

          const lastHolidayMessage = await Message.findOne({
            where: {
              ticketId: ticket.id,
              fromMe: true,
              body: activeHolidayPeriod.message,
              createdAt: {
                [Op.gte]: intervalStart
              }
            },
            order: [["createdAt", "DESC"]]
          });

          if (!lastHolidayMessage) {
            // Formata as datas no formato DIA/MES/ANO
            const formatDateBR = (dateValue: Date | string): string => {
              if (!dateValue) return "";
              
              let dateStr: string;
              if (dateValue instanceof Date) {
                // Se é Date, extrai usando UTC e formata como YYYY-MM-DD
                const year = dateValue.getUTCFullYear();
                const month = String(dateValue.getUTCMonth() + 1).padStart(2, '0');
                const day = String(dateValue.getUTCDate()).padStart(2, '0');
                dateStr = `${year}-${month}-${day}`;
              } else {
                dateStr = String(dateValue);
              }
              
              // Se já está no formato YYYY-MM-DD, converte para DD/MM/YYYY
              if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                const [year, month, day] = dateStr.split('-');
                return `${day}/${month}/${year}`;
              }
              
              // Fallback: tenta converter de Date
              const date = new Date(dateStr);
              const day = String(date.getUTCDate()).padStart(2, '0');
              const month = String(date.getUTCMonth() + 1).padStart(2, '0');
              const year = date.getUTCFullYear();
              return `${day}/${month}/${year}`;
            };

            const startDateValue = activeHolidayPeriod.getDataValue('startDate');
            const endDateValue = activeHolidayPeriod.getDataValue('endDate');
            const startDateFormatted = formatDateBR(startDateValue);
            const endDateFormatted = formatDateBR(endDateValue);

            // Adiciona as variáveis de data ao formatBody
            const holidayMessage = formatBody(
              activeHolidayPeriod.message, 
              contact,
              {
                startDate: startDateFormatted,
                endDate: endDateFormatted
              }
            );
            const sentMessage = await wbot.sendMessage(
              `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
              {
                text: holidayMessage
              }
            );
            await verifyMessage(sentMessage, ticket, contact);
            
            // Se "Mesmo com recesso fila funciona" está desabilitado, retorna sem processar nada
            if (!holidayPeriodAllowQueueFlow) {
              return; // Não processa nada durante recesso
            }
            // Se "Mesmo com recesso fila funciona" está habilitado, continua o processamento (filas funcionam, mas sem atendimento)
          }
        }
      }
    }

    await provider(ticket, msg, companyId, contact, wbot as WASocket);

    //DESABILITADO INTERAÇÕES NOS GRUPOS USANDO O && !isGroup e if (isGroup || contact.disableBot)//
	
	// voltar para o menu inicial
	
    // voltar para o menu inicia
    if (bodyMessage == "#" && !isGroup) {
      await ticket.update({
        queueOptionId: null,
        chatbot: false,
        queueId: null,
      });
      await verifyQueue(wbot, msg, ticket, ticket.contact);
      return;
    }


    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId: ticket.id,
      companyId,
      whatsappId: whatsapp?.id
    });


    try {
       if (!msg.key.fromMe && !contact.isGroup) {
        /**
         * Tratamento para avaliação do atendente
         */

        // // dev Ricardo: insistir a responder avaliação
        // const rate_ = Number(bodyMessage);

        // if (
        //   (ticket?.lastMessage.includes("_Insatisfeito_") ||
        //     ticket?.lastMessage.includes(
        //       "Por favor avalie nosso atendimento."
        //     )) &&
        //   !isFinite(rate_)
        // ) {
        //   const debouncedSentMessage = debounce(
        //     async () => {
        //       await wbot.sendMessage(
        //         `${ticket.contact.number}@${
        //           ticket.isGroup ? "g.us" : "s.whatsapp.net"
        //         }`,
        //         {
        //           text: "Por favor avalie nosso atendimento."
        //         }
        //       );
        //     },
        //     1000,
        //     ticket.id
        //   );
        //   debouncedSentMessage();
        //   return;
        // }
        // // dev Ricardo

        if (
          ticketTraking !== null &&
          isNumeric(bodyMessage) &&
          verifyRating(ticketTraking)
        ) {
          await handleRating(
            parseFloat(bodyMessage),
            ticket,
            ticketTraking,
            contact
          );
          return;
        }
      }
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }
	

    // Atualiza o ticket se a ultima mensagem foi enviada por mim, para que possa ser finalizado. 
    try {
      await ticket.update({
        fromMe: msg.key.fromMe,
      });
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }

    if (hasMedia) {
      mediaSent = await verifyMediaMessage(msg, ticket, contact);
    } else {
      await verifyMessage(msg, ticket, contact);
    }
	
    if (isGroup || contact.disableBot) {
      return;
    }

    const currentSchedule = await VerifyCurrentSchedule(companyId);
    const scheduleType = await Setting.findOne({
      where: {
        companyId,
        key: "scheduleType"
      }
    });


    try {
      if (!msg.key.fromMe && scheduleType && ticket.status !== "open") {
        /**
         * Tratamento para envio de mensagem quando a empresa está fora do expediente
         */
        if (
          scheduleType.value === "company" &&
          !isNil(currentSchedule) &&
          (!currentSchedule || currentSchedule.inActivity === false)
        ) {
          const body = formatBody(`\u200e${whatsapp.outOfHoursMessage}`, ticket.contact);

          console.log('body9341023', body)
          const debouncedSentMessage = debounce(
            async () => {
              await wbot.sendMessage(
                `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
                }`,
                {
                  text: body
                }
              );
            },
            3000,
            ticket.id
          );
          debouncedSentMessage();
          return;
        }

        console.log('MSG:', bodyMessage);
        if (scheduleType.value === "queue" && ticket.queueId !== null) {

          /**
           * Tratamento para envio de mensagem quando a fila está fora do expediente
           */


          const queue = await Queue.findByPk(ticket.queueId);

          const { schedules }: any = queue;
          const now = moment();
          const weekday = now.format("dddd").toLowerCase();
          let schedule = null;

          if (Array.isArray(schedules) && schedules.length > 0) {
            schedule = schedules.find(
              s =>
                s.weekdayEn === weekday &&
                s.startTimeA !== "" &&
                s.startTimeA !== null &&
                s.endTimeA !== "" &&
                s.endTimeA !== null
            );
          }

          if (
            scheduleType.value === "queue" &&
            queue.outOfHoursMessage !== null &&
            queue.outOfHoursMessage !== "" &&
            !isNil(schedule)
          ) {
            const startTimeA = moment(schedule.startTimeA, "HH:mm");
            const endTimeA = moment(schedule.endTimeA, "HH:mm");
			const startTimeB = moment(schedule.startTimeB, "HH:mm");
            const endTimeB = moment(schedule.endTimeB, "HH:mm");

            if (now.isBefore(startTimeA) || now.isAfter(endTimeA) && (now.isBefore(startTimeB) || now.isAfter(endTimeB))) {
			  const body = queue.outOfHoursMessage;
              console.log('body:23801', body)
              const debouncedSentMessage = debounce(
                async () => {
                  await wbot.sendMessage(
                    `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
                    }`,
                    {
                      text: body
                    }
                  );
                },
                3000,
                ticket.id
              );
              debouncedSentMessage();
              return;
            }
          }
        }

      }
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }

    //openai na conexao
    if (
      !ticket.queue &&
      !isGroup &&
      !msg.key.fromMe &&
      !ticket.userId &&
      !isNil(whatsapp.promptId)
    ) {
      await handleOpenAi(msg, wbot, ticket, contact, mediaSent);
    }

    //integraçao na conexao
    if (
      !msg.key.fromMe &&
      !ticket.isGroup &&
      !ticket.queue &&
      !ticket.user &&
      ticket.chatbot &&
      !isNil(whatsapp.integrationId) &&
      !ticket.useIntegration
    ) {

      const integrations = await ShowQueueIntegrationService(whatsapp.integrationId, companyId);

      await handleMessageIntegration(msg, wbot, integrations, ticket)

      return
    }

    //openai na fila
    if (
      !isGroup &&
      !msg.key.fromMe &&
      !ticket.userId &&
      !isNil(ticket.promptId) &&
      ticket.useIntegration &&
      ticket.queueId

    ) {
      await handleOpenAi(msg, wbot, ticket, contact, mediaSent);
    }

    if (
      !msg.key.fromMe &&
      !ticket.isGroup &&
      !ticket.userId &&
      ticket.integrationId &&
      ticket.useIntegration &&
      ticket.queue
    ) {

      console.log("entrou no type 1974")
      const integrations = await ShowQueueIntegrationService(ticket.integrationId, companyId);

      await handleMessageIntegration(msg, wbot, integrations, ticket)

    }

    if (
      !ticket.queue &&
      !ticket.isGroup &&
      !msg.key.fromMe &&
      !ticket.userId &&
      whatsapp.queues.length >= 1 &&
      !ticket.useIntegration
    ) {

      await verifyQueue(wbot, msg, ticket, contact);

      if (ticketTraking.chatbotAt === null) {
        await ticketTraking.update({
          chatbotAt: moment().toDate(),
        })
      }
    }

    const dontReadTheFirstQuestion = ticket.queue === null;

    await ticket.reload();

    try {
      //Fluxo fora do expediente
      if (!msg.key.fromMe && scheduleType && ticket.queueId !== null && ticket.status !== "open") {
        /**
         * Tratamento para envio de mensagem quando a fila está fora do expediente
         */
        const queue = await Queue.findByPk(ticket.queueId);

        const { schedules }: any = queue;
        const now = moment();
        const weekday = now.format("dddd").toLowerCase();
        let schedule = null;

        if (Array.isArray(schedules) && schedules.length > 0) {
          schedule = schedules.find(
            s =>
              s.weekdayEn === weekday &&
              s.startTimeA !== "" &&
              s.startTimeA !== null &&
              s.endTimeA !== "" &&
              s.endTimeA !== null
          );
        }

        if (
          scheduleType.value === "queue" &&
          queue.outOfHoursMessage !== null &&
          queue.outOfHoursMessage !== "" &&
          !isNil(schedule)
        ) {
          const startTimeA = moment(schedule.startTimeA, "HH:mm");
          const endTimeA = moment(schedule.endTimeA, "HH:mm");
          const startTimeB = moment(schedule.startTimeB, "HH:mm");
          const endTimeB = moment(schedule.endTimeB, "HH:mm");		  

          if (now.isBefore(startTimeA) || now.isAfter(endTimeA) && (now.isBefore(startTimeB) || now.isAfter(endTimeB))) {
            const body = queue.outOfHoursMessage;
            console.log('body158964153', body)
            const debouncedSentMessage = debounce(
              async () => {
                await wbot.sendMessage(
                  `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
                  }`,
                  {
                    text: body
                  }
                );
              },
              3000,
              ticket.id
            );
            debouncedSentMessage();
            return;
          }
        }
      }
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }



    if (!whatsapp?.queues?.length && !ticket.userId && !isGroup && !msg.key.fromMe) {

      const lastMessage = await Message.findOne({
        where: {
          ticketId: ticket.id,
          fromMe: true
        },
        order: [["createdAt", "DESC"]]
      });

      if (lastMessage && lastMessage.body.includes(whatsapp.greetingMessage)) {
        return;
      }

      if (whatsapp.greetingMessage || whatsapp.greetingMediaPath) {
        console.log('whatsapp.greetingMessage', whatsapp.greetingMessage)
        const debouncedSentMessage = debounce(
          async () => {
            const hasMedia = whatsapp.greetingMediaPath && whatsapp.greetingMediaPath !== "";
            const hasMessage = whatsapp.greetingMessage && whatsapp.greetingMessage.trim() !== "";

            // Sempre envia mídia primeiro (modo "separate")
            if (hasMedia) {
              const filePath = path.resolve("public", `company${ticket.companyId}`, whatsapp.greetingMediaPath);
              const optionsMsg = await getMessageOptions(whatsapp.greetingMediaName || "imagem", filePath, ticket.companyId.toString(), "");
              if (optionsMsg) {
                const sentMediaMessage = await wbot.sendMessage(
                  `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                  { ...optionsMsg }
                );
                // Adiciona mediaUrl ao sentMessage para identificar que é mídia de saudação
                if (sentMediaMessage) {
                  (sentMediaMessage as any).mediaUrl = whatsapp.greetingMediaPath;
                }
                await verifyMediaMessage(sentMediaMessage, ticket, ticket.contact);
                await delay(500);
              }
            }
            
            // Só envia a saudação como texto separado se NÃO houver filas
            // Se houver filas, o menu será enviado depois pela função handleChartbot
            const hasQueues = whatsapp.queues && whatsapp.queues.length > 0;
            if (hasMessage && !hasQueues) {
              await delay(500);
              const sentTextMessage = await wbot.sendMessage(
                `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                {
                  text: whatsapp.greetingMessage
                }
              );
              await verifyMessage(sentTextMessage, ticket, ticket.contact);
            }
          },
          1000,
          ticket.id
        );
        debouncedSentMessage();
        return;
      }

    }


    if (whatsapp.queues.length == 1 && ticket.queue) {
      if (ticket.chatbot && !msg.key.fromMe) {
        await handleChartbot(ticket, msg, wbot);
      }
    }
    if (whatsapp.queues.length > 1 && ticket.queue) {
      if (ticket.chatbot && !msg.key.fromMe) {
        await handleChartbot(ticket, msg, wbot, dontReadTheFirstQuestion);
      }
    }

  } catch (err) {
    console.log(err)
    Sentry.captureException(err);
    logger.error(`Error handling whatsapp message: Err: ${err}`);
  }
};


const handleMsgAck = async (
  msg: WAMessage,
  chat: number | null | undefined
) => {
  await new Promise((r) => setTimeout(r, 500));
  const io = getIO();

  try {
    const messageToUpdate = await Message.findByPk(msg.key.id, {
      include: [
        "contact",
        {
          model: Message,
          as: "quotedMsg",
          include: ["contact"],
        },
      ],
    });

    if (!messageToUpdate) return;
    await messageToUpdate.update({ ack: chat });
    io.to(messageToUpdate.ticketId.toString()).emit(
      `company-${messageToUpdate.companyId}-appMessage`,
      {
        action: "update",
        message: messageToUpdate,
      }
    );
  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Error handling message ack. Err: ${err}`);
  }
};

const verifyRecentCampaign = async (
  message: proto.IWebMessageInfo,
  companyId: number
) => {
  if (!message.key.fromMe) {
    const number = message.key.remoteJid.replace(/\D/g, "");
    const campaigns = await Campaign.findAll({
      where: { companyId, status: "EM_ANDAMENTO", confirmation: true },
    });
    if (campaigns) {
      const ids = campaigns.map((c) => c.id);
      const campaignShipping = await CampaignShipping.findOne({
        where: { campaignId: { [Op.in]: ids }, number, confirmation: null },
      });

      if (campaignShipping) {
        await campaignShipping.update({
          confirmedAt: moment(),
          confirmation: true,
        });
        await campaignQueue.add(
          "DispatchCampaign",
          {
            campaignShippingId: campaignShipping.id,
            campaignId: campaignShipping.campaignId,
          },
          {
            delay: parseToMilliseconds(randomValue(0, 10)),
          }
        );
      }
    }
  }
};

const verifyCampaignMessageAndCloseTicket = async (
  message: proto.IWebMessageInfo,
  companyId: number
) => {
  const io = getIO();
  const body = getBodyMessage(message);
  const isCampaign = /\u200c/.test(body);
  if (message.key.fromMe && isCampaign) {
    const messageRecord = await Message.findOne({
      where: { id: message.key.id!, companyId },
    });

    if (!messageRecord) return;

    const ticket = await Ticket.findByPk(messageRecord.ticketId);
    if (!ticket) return;

    await ticket.update({ status: "closed" });

    io.to(`company-${ticket.companyId}-open`)
      .to(`queue-${ticket.queueId}-open`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id,
      });

    io.to(`company-${ticket.companyId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .to(ticket.id.toString())
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id,
      });
  }
};


const filterMessages = (msg: WAMessage): boolean => {
  // receiving edited message
  if (msg.message?.protocolMessage?.editedMessage) return true;
  // receiving message deletion info
  if (msg.message?.protocolMessage?.type === 0) return true;
  // ignore other protocolMessages
  if (msg.message?.protocolMessage) return false;

  if (
    [
      WAMessageStubType.REVOKE,
      WAMessageStubType.E2E_DEVICE_CHANGED,
      WAMessageStubType.E2E_IDENTITY_CHANGED,
      WAMessageStubType.CIPHERTEXT
    ].includes(msg.messageStubType)
  )
    return false;

  return true;
};

const wbotMessageListener = async (wbot: Session, companyId: number): Promise<void> => {
  try {
    // Remover listeners antigos para evitar duplicação
    wbot.ev.removeAllListeners("messages.upsert");
    wbot.ev.removeAllListeners("messages.update");

    logger.info(`Registrando listeners de mensagens para WhatsApp ID: ${wbot.id}, Company ID: ${companyId}`);

    const messageCache = new Set<string>();
    const CACHE_TIMEOUT = 1000 * 60 * 5; 

    setInterval(() => {
      messageCache.clear();
    }, CACHE_TIMEOUT);

    const messageQueue: proto.IWebMessageInfo[] = [];
    let processingQueue = false;

    const processMessageQueue = async () => {
      if (processingQueue || messageQueue.length === 0) return;
      
      processingQueue = true;
      try {
        const messagesToProcess = [...messageQueue];
        messageQueue.length = 0;

        await Promise.all(
          messagesToProcess.map(async (message) => {
            try {
              const messageId = message.key.id!;
              
              if (messageCache.has(messageId)) return;
              messageCache.add(messageId);

              const messageExists = await Message.findOne({
                where: { id: messageId, companyId },
                attributes: ['id']
              });

              if (!messageExists) {
                await Promise.all([
                  handleMessage(message, wbot, companyId),
                  verifyRecentCampaign(message, companyId),
                  verifyCampaignMessageAndCloseTicket(message, companyId)
                ]);
              }
            } catch (err) {
              logger.error(`Error processing message ${message.key.id}: ${err}`);
              Sentry.captureException(err);
            }
          })
        );
      } finally {
        processingQueue = false;
      }
    };

    setInterval(processMessageQueue, 100);
    
    // wbot.ev.on("messages.upsert", async (
    //   { messages, type, requestId }: { messages: WAMessage[]; type: MessageUpsertType; requestId?: string }
    // ) => {
    //   messages
    //     .filter(filterMessages)
    //     .map(msg => msg);
    //     console.log('messages.upsert:::::', messages)

    //     // const message = messages[0]
    //     // console.log('key:::::', message.key)

    //   if (!messages?.length) return;

    //   messageQueue.push(...messages);
    // });

    wbot.ev.on("messages.upsert", async (messageUpsert: ImessageUpsert) => {
      try {
        const messages = messageUpsert.messages
          .filter(filterMessages)
          .map(msg => msg);
        console.log('messages.upsert:::::', messages)

        if (!messages?.length) return;

        messageQueue.push(...messages);
      } catch (err) {
        logger.error(`Erro no listener messages.upsert: ${err}`);
        Sentry.captureException(err);
      }
    });

    wbot.ev.on("messages.update", async (messageUpdate: WAMessageUpdate[]) => {
      try {
        if (!messageUpdate?.length) return;

        const updates = messageUpdate.map(async (message: WAMessageUpdate) => {
          try {
            if (message.update.status) {
              await (wbot as WASocket)!.readMessages([message.key]);
            }

            if (
              message.update.messageStubType === 1 && 
              message.key.remoteJid !== 'status@broadcast'
            ) {
              await MarkDeleteWhatsAppMessage(
                message.key.remoteJid,
                null,
                message.key.id,
                companyId
              );
            }

            await handleMsgAck(message, message.update.status);
          } catch (err) {
            logger.error(`Erro ao processar update de mensagem: ${err}`);
            Sentry.captureException(err);
          }
        });

        await Promise.all(updates);
      } catch (err) {
        logger.error(`Erro no listener messages.update: ${err}`);
        Sentry.captureException(err);
      }
    });

    logger.info(`Listeners de mensagens registrados com sucesso para WhatsApp ID: ${wbot.id}`);

  } catch (error) {
    Sentry.captureException(error);
    logger.error(`Error handling wbot message listener. Err: ${error}`);
    
    setTimeout(() => {
      wbotMessageListener(wbot, companyId)
        .catch(err => logger.error(`Error reconnecting wbot: ${err}`));
    }, 5000);
  }
};


export { handleMessage, wbotMessageListener, handleMsgAck };
