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

export const getJidFromMessage = async (message: WAMessage | proto.IWebMessageInfo, wbot: Session): Promise<string> => {
  // Garantir que a mensagem tem a propriedade key
  if (!message || !message.key) {
    throw new Error('Mensagem inválida: propriedade key não encontrada');
  }
  
  const { key } = message;
  const keyAny = key as { remoteJid?: string; participant?: string; sender_pn?: string };
  const { remoteJid, participant } = keyAny;
  let jid = '';

  // Quando remoteJid é LID (@lid), usar sender_pn como JID (número real do contato)
  if (remoteJid && remoteJid.includes('@lid') && keyAny.sender_pn && keyAny.sender_pn.includes('@s.whatsapp.net')) {
    jid = keyAny.sender_pn;
  }
  // Conversa direta: JID no remoteJid
  else if (remoteJid && remoteJid.includes('@s.whatsapp.net')) {
    jid = remoteJid;
  }
  // Grupo: participante tem o JID do usuário
  else if (participant && participant.includes('@s.whatsapp.net')) {
    jid = participant;
  }

  if (!jid) {
    console.log('JID final para envio: (vazio - remoteJid/participant/sender_pn não disponíveis)', { remoteJid, participant, sender_pn: keyAny.sender_pn });
    throw new Error('Não foi possível obter JID da mensagem (remoteJid pode ser LID sem sender_pn)');
  }

  const jidSplitedPontos = jid.split(':')[0];
  const jidSplitedArroba = jid.split('@')[1];
  jid = jidSplitedPontos.includes('@') ? jid : `${jidSplitedPontos}@${jidSplitedArroba}`;
  console.log('JID final para envio:', jid);
  return jid;
};

export const getLidFromMessage = async (message: WAMessage | proto.IWebMessageInfo, wbot: Session): Promise<string> => {
  // Garantir que a mensagem tem a propriedade key
  if (!message || !message.key) {
    throw new Error('Mensagem inválida: propriedade key não encontrada');
  }
  
  const { key } = message;
  const { remoteJid, participant } = key;
  let lid = '';

  // Prioridade: LID > JID > PN
  if (remoteJid && remoteJid.includes('@lid')) {
    lid = remoteJid;
  }else {
    console.log('RemoteJid nao contem @lid:', remoteJid);
    return ''; // retorna vazio porque só é lid quando vem lid no remoteJid
  }
  if (participant && participant.includes('@lid')) {
    lid = participant;
  }
  return lid;
};
