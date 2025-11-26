import { WAMessage, WASocket, proto } from "baileys";
import { LIDMappingStore } from "baileys/lib/Signal/lid-mapping";

import { Store } from "../libs/store";
import { logger } from "./logger";
type Session = WASocket & {
  id?: number;
  store?: Store;
  lidMappingStore?: LIDMappingStore; // LIDMappingStore da v7.0.0-rc.2
};

export const map_msg = new Map<any, any>();


export const getContactIdentifier = (contact: any): string => {
  // verificar se o contact esta limpo ou veio direto do banco de dados
  // se veio do banco de dados, pode ser que esteja null ou undefined
  // então tratar isso
//   if (!contact) {
//     console.log('Contact é nulo ou indefinido:', contact);
//     return '';
//   }else if (contact?.dataValues) {
//     contact = contact.dataValues;
//   }
//   // console.log('Contact recebido em getContactIdentifier:', contact);
//   if (contact?.lid) {
//     console.log('Usando LID para envio:', contact.lid);
//     return contact.lid;
//   } else {
//     console.log('Usando JID para envio:', contact.number);
//     return contact.number;
//   }
// };
if (!contact) {
  console.log('Contact é nulo ou indefinido:', contact);
  return '';
}else if (contact?.dataValues) {
  contact = contact.dataValues;
}
// console.log('Contact recebido em getContactIdentifier:', contact);
console.log('Usando NUMBER para envio:', contact.number);
return contact.number;
};


// Função helper para construir o endereço de envio
export const buildContactAddress = (contact: any, isGroup: boolean): string => {
  // console.log('Contact recebido em buildContactAddress:', contact, 'isGroup:', isGroup);
  const contactId = getContactIdentifier(contact);
  const domain = isGroup ? "@g.us" : contactId.includes("@") ? "" : "@s.whatsapp.net";
  return `${contactId}${domain}`;
};

// Função para extrair número de telefone do JID limitando a 12 dígitos
// Evita capturar o décimo terceiro dígito que pode vir incorretamente no JID
const extractPhoneNumber = (jid: string): string => {
  if (!jid || typeof jid !== 'string') return '';
  
  // Remove caracteres não numéricos
  const cleanNumber = jid.replace(/[^0-9]/g, "");
  
  // Limita a 12 dígitos desde o início - números brasileiros têm no máximo 12 dígitos
  // Isso evita capturar o décimo terceiro dígito que pode vir incorretamente no JID
  return cleanNumber.slice(0, 12);
};

export const getJidFromMessage = async (message: WAMessage | proto.IWebMessageInfo, wbot: Session): Promise<string> => {
  // Garantir que a mensagem tem a propriedade key
  if (!message || !message.key) {
    throw new Error('Mensagem inválida: propriedade key não encontrada');
  }
  
  const { key } = message;
  const { remoteJid, participant } = key;
  // Verificar se key tem propriedades estendidas (remoteJidAlt, participantAlt)
  const keyExtended = key as any;
  const remoteJidAlt = keyExtended.remoteJidAlt;
  const participantAlt = keyExtended.participantAlt;
  
  let jid = '';

  // Prioridade: JID > LID > PN
  if (remoteJid && remoteJid.includes('@s.whatsapp.net')) {
    jid = remoteJid;
  }
  if (remoteJidAlt && remoteJidAlt.includes('@s.whatsapp.net')) {
    jid = remoteJidAlt;
  }
  if (participant && participant.includes('@s.whatsapp.net')) {
    jid = participant;
  }

  if (participantAlt && participantAlt.includes('@s.whatsapp.net')) {
    jid = participantAlt;
  }

  const lidMappingStore = getLIDMappingStore(wbot);
  if (lidMappingStore) {
    const jidForPN = await lidMappingStore.getPNForLID(remoteJid);
    if (jidForPN && jidForPN.includes('@s.whatsapp.net')) {
      // Normalizar o número extraído do JID para limitar a 12 dígitos
      const jidNumber = extractPhoneNumber(jidForPN);
      const jidDomain = jidForPN.split('@')[1] || 's.whatsapp.net';
      jid = `${jidNumber}@${jidDomain}`;
      console.log('JID encontrado via LIDMappingStore (normalizado):', jid);
    } else {
      console.log('JID não encontrado na LIDMappingStore para o PN:', remoteJid);
    }
  } else {
    logger.error(`LIDMappingStore nao disponivel ou JID nao encontrado na mensagem, jid: ${!!jid}, lidMappingStore: ${!!lidMappingStore}`);
  }
  const jidSplitedPontos = jid.split(':')[0];
  const jidSplitedArroba = jid.split('@')[1];
  jid = jidSplitedPontos.includes('@') ? jid : `${jidSplitedPontos}@${jidSplitedArroba}`;
  
  // Garantir que o número no JID final também está limitado a 12 dígitos
  if (jid.includes('@s.whatsapp.net')) {
    const jidParts = jid.split('@');
    const normalizedNumber = extractPhoneNumber(jidParts[0]);
    jid = `${normalizedNumber}@${jidParts[1]}`;
  }
  
  console.log('JID final para envio:', jid);
  return jid;
};

// Função para acessar LIDMappingStore de forma segura
const getLIDMappingStore = (wbot: Session): any => {
  try {
    // Tentar acessar o LIDMappingStore de diferentes formas
    return wbot.lidMappingStore ||
      (wbot as any).lidMappingStore ||
      null;
  } catch (error) {
    logger.warn(`Erro ao acessar LIDMappingStore: ${error.message}`);
    return null;
  }
};
export const getLidFromMessage = async (message: WAMessage | proto.IWebMessageInfo, wbot: Session): Promise<string> => {
  // Garantir que a mensagem tem a propriedade key
  if (!message || !message.key) {
    throw new Error('Mensagem inválida: propriedade key não encontrada');
  }
  
  const { key } = message;
  const { remoteJid, participant } = key;
  // Verificar se key tem propriedades estendidas (remoteJidAlt, participantAlt)
  const keyExtended = key as any;
  const remoteJidAlt = keyExtended.remoteJidAlt;
  const participantAlt = keyExtended.participantAlt;

  let lid = '';

  // Prioridade: LID > JID > PN
  if (remoteJid && remoteJid.includes('@lid')) {
    lid = remoteJid;
  }else {
    console.log('RemoteJid nao contem @lid:', remoteJid);
    return ''; // retorna vazio porque só é lid quando vem lid no remoteJid
  }
  if (remoteJidAlt && remoteJidAlt.includes('@lid')) {
    lid = remoteJidAlt;
  }
  if (participant && participant.includes('@lid')) {
    lid = participant;
  }

  if (participantAlt && participantAlt.includes('@lid')) {
    lid = participantAlt;
  }

  const lidMappingStore = getLIDMappingStore(wbot);
  if (lidMappingStore && lid) {
    const lidForPN = await lidMappingStore.getLIDForPN(remoteJid);
    if (lidForPN && lidForPN.includes('@lid')) {
      lid = lidForPN;
      console.log('LID encontrado via LIDMappingStore:', lid);
    } else {
      console.log('LID não encontrado na LIDMappingStore para o PN:', remoteJid);
    }
  } else {
    logger.error(`LIDMappingStore nao disponivel ou LID nao encontrado na mensagem, lid: ${!!lid}, lidMappingStore: ${!!lidMappingStore}`);
  }
  return lid;
};