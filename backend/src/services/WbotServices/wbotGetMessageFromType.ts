import { proto } from "baileys";

// Função para extrair informações de mensagens de texto
export const getTextMessage = (msg: proto.IWebMessageInfo) => {
  return msg.message?.conversation;
};

// Função para extrair informações de mensagens de imagem
export const getImageMessage = (msg: proto.IWebMessageInfo) => {
  return msg.message?.imageMessage?.caption || "Imagem";
};

// Função para extrair informações de mensagens de vídeo
export const getVideoMessage = (msg: proto.IWebMessageInfo) => {
  return msg.message?.videoMessage?.caption || "Vídeo";
};

// Função para extrair informações de mensagens de áudio
export const getAudioMessage = (msg: proto.IWebMessageInfo) => {
  return "Áudio";
};

// Função para extrair informações de mensagens de documento
export const getDocumentMessage = (msg: proto.IWebMessageInfo) => {
  return msg.message?.documentMessage?.fileName || "Documento";
};

// Função para extrair informações de mensagens de localização
export const getLocationMessage = (msg: proto.IWebMessageInfo) => {
  return {
    latitude: msg.message?.locationMessage?.degreesLatitude,
    longitude: msg.message?.locationMessage?.degreesLongitude
  };
};

// Função para extrair informações de mensagens de contato
export const getContactMessage = (msg: proto.IWebMessageInfo) => {
  return msg.message?.contactMessage?.displayName;
};

// Função para extrair informações de mensagens de botão
export const getButtonsMessage = (msg: proto.IWebMessageInfo) => {
  return msg.message?.buttonsResponseMessage?.selectedButtonId;
};

// Função para extrair informações de mensagens de lista
export const getListMessage = (msg: proto.IWebMessageInfo) => {
  return msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
};

// Função para extrair informações de mensagens de reação
export const getReactionMessage = (msg: proto.IWebMessageInfo) => {
  return msg.message?.reactionMessage?.text;
};

// Função para extrair informações de mensagens de adesivo (sticker)
export const getStickerMessage = (msg: proto.IWebMessageInfo) => {
  return msg.message?.stickerMessage;
};

// Função para extrair informações de mensagens de modelo (template)
export const getTemplateMessage = (msg: proto.IWebMessageInfo) => {
  return msg.message?.templateMessage?.hydratedTemplate?.hydratedContentText;
};

// Função para extrair informações de mensagens de pagamento
export const getPaymentMessage = (msg: proto.IWebMessageInfo) => {
  return msg.message?.sendPaymentMessage?.noteMessage;
};

// Função para extrair informações de mensagens de convite de grupo
export const getGroupInviteMessage = (msg: proto.IWebMessageInfo) => {
  return msg.message?.groupInviteMessage?.groupName;
};

// Função para extrair informações de mensagens de chamada
export const getCallMessage = (msg: proto.IWebMessageInfo) => {
  return msg.message?.bcallMessage?.sessionId;
};

export const getViewOnceMessage = (msg: proto.IWebMessageInfo): string => {
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

export const getAd = (msg: proto.IWebMessageInfo): string => {
  if (msg.key.fromMe && msg.message?.listResponseMessage?.contextInfo?.externalAdReply) {
    let bodyMessage = `*${msg.message?.listResponseMessage?.contextInfo?.externalAdReply?.title}*`;
    bodyMessage += `\n\n${msg.message?.listResponseMessage?.contextInfo?.externalAdReply?.body}`;
    return bodyMessage;
  }
};

export const getBodyButton = (msg: proto.IWebMessageInfo): string => {
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
