import { WAMessage, WASocket, proto } from "libzapitu-rf";

import { Store } from "../libs/store";
import { logger } from "./logger";
type Session = WASocket & {
  id?: number;
  store?: Store;
};

export const map_msg = new Map<any, any>();


export const getContactIdentifier = (contact: any): string => {
  if (!contact) {
    console.log("Contact é nulo ou indefinido:", contact);
    return "";
  }
  if (contact?.dataValues) {
    contact = contact.dataValues;
  }
  console.log("Usando NUMBER para envio:", contact.number);
  return contact.number;
};


// Função helper para construir o endereço de envio
export const buildContactAddress = (contact: any, isGroup: boolean): string => {
  // console.log('Contact recebido em buildContactAddress:', contact, 'isGroup:', isGroup);
  const contactId = getContactIdentifier(contact);
  const domain = isGroup ? "@g.us" : contactId.includes("@") ? "" : "@s.whatsapp.net";
  return `${contactId}${domain}`;
};

// Função para extrair número de telefone do JID
// Suporta números de qualquer país (até 15 dígitos conforme padrão internacional)
const extractPhoneNumber = (jid: string): string => {
  if (!jid || typeof jid !== 'string') return '';
  
  // Remove caracteres não numéricos
  const cleanNumber = jid.replace(/[^0-9]/g, "");
  
  // Limita a 15 dígitos - padrão internacional máximo para números de telefone
  return cleanNumber.slice(0, 15);
};

const normalizeJid = (jid: string): string => {
  if (!jid || typeof jid !== "string") return "";
  const trimmed = jid.trim();
  if (!trimmed.includes("@")) return trimmed;
  const [localPart, domain] = trimmed.split("@");
  return `${localPart.split(":")[0]}@${domain}`;
};

const resolvePnFromLid = async (
  lid: string,
  wbot: Session
): Promise<string> => {
  if (!lid || !lid.includes("@lid")) return "";

  try {
    const lidMappingStore = (wbot as any)?.lidMappingStore;
    if (lidMappingStore?.getPNForLID) {
      const mappedJid = await lidMappingStore.getPNForLID(lid);
      if (typeof mappedJid === "string" && mappedJid.includes("@s.whatsapp.net")) {
        return normalizeJid(mappedJid);
      }
    }
  } catch (error) {
    logger.warn(`Falha ao resolver PN a partir do LID ${lid}: ${(error as Error).message}`);
  }

  return "";
};

export const getJidFromMessage = async (message: WAMessage | proto.IWebMessageInfo, wbot: Session): Promise<string> => {
  if (!message || !message.key) {
    throw new Error("Mensagem inválida: propriedade key não encontrada");
  }

  const { key } = message;
  const keyAny = key as {
    remoteJid?: string;
    participant?: string;
    sender_pn?: string;
    peer_recipient_pn?: string;
  };

  const remoteJid = normalizeJid(keyAny.remoteJid || "");
  const participant = normalizeJid(keyAny.participant || "");
  const senderPn = normalizeJid(keyAny.sender_pn || "");
  const peerRecipientPn = normalizeJid(keyAny.peer_recipient_pn || "");

  let jid = "";

  if (remoteJid.includes("@s.whatsapp.net") || remoteJid.includes("@g.us")) {
    jid = remoteJid;
  } else if (participant.includes("@s.whatsapp.net")) {
    jid = participant;
  } else if (senderPn.includes("@s.whatsapp.net")) {
    jid = senderPn;
  } else if (peerRecipientPn.includes("@s.whatsapp.net")) {
    jid = peerRecipientPn;
  } else if (remoteJid.includes("@lid")) {
    jid = await resolvePnFromLid(remoteJid, wbot);
  } else if (participant.includes("@lid")) {
    jid = await resolvePnFromLid(participant, wbot);
  }

  if (!jid) {
    console.log("JID final para envio: (vazio - remoteJid/participant/sender_pn/peer_recipient_pn não disponíveis)", {
      remoteJid,
      participant,
      sender_pn: senderPn,
      peer_recipient_pn: peerRecipientPn
    });
    throw new Error("Não foi possível obter JID da mensagem");
  }

  const normalizedJid = normalizeJid(jid);
  console.log("JID final para envio:", normalizedJid);
  return normalizedJid;
};

export const getLidFromMessage = async (message: WAMessage | proto.IWebMessageInfo, wbot: Session): Promise<string> => {
  if (!message || !message.key) {
    throw new Error("Mensagem inválida: propriedade key não encontrada");
  }

  const keyAny = message.key as {
    remoteJid?: string;
    participant?: string;
  };

  const participant = normalizeJid(keyAny.participant || "");
  const remoteJid = normalizeJid(keyAny.remoteJid || "");

  if (participant.includes("@lid")) {
    return participant;
  }

  if (remoteJid.includes("@lid")) {
    return remoteJid;
  }

  return "";
};
