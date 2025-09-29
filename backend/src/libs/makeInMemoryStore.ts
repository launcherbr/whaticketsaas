import { BaileysEventEmitter, BaileysEventMap, Chat, Contact, GroupMetadata, PresenceData, proto, WAMessageCursor, WAMessageKey, WASocket, WAConnectionState } from "baileys";
// import KeyedDB from "@adiwajshing/keyed-db";
import { logger } from "../utils/logger";
import * as fs from "fs";
import * as path from "path";

export interface Store {
  chats: Chat[];
  contacts: {
    [_: string]: Contact;
  };
  messages: {
    [_: string]: {
      array: proto.IWebMessageInfo[];
      get: (id: string) => proto.IWebMessageInfo;
      upsert: (item: proto.IWebMessageInfo, mode: "append" | "prepend") => void;
      update: (item: proto.IWebMessageInfo) => boolean;
      remove: (item: proto.IWebMessageInfo) => boolean;
      updateAssign: (
        id: string,
        update: Partial<proto.IWebMessageInfo>
      ) => boolean;
      clear: () => void;
      filter: (contain: (item: proto.IWebMessageInfo) => boolean) => void;
      toJSON: () => proto.IWebMessageInfo[];
      fromJSON: (newItems: proto.IWebMessageInfo[]) => void;
    };
  };
  groupMetadata: {
    [_: string]: GroupMetadata;
  };
  state: {
    connection: WAConnectionState;
    lastDisconnect?: {
      error: Error;
      date: Date;
    };
    isNewLogin?: boolean;
    qr?: string;
    receivedPendingNotifications?: boolean;
  };
  presences: {
    [id: string]: {
      [participant: string]: PresenceData;
    };
  };
  bind: (ev: BaileysEventEmitter) => void;
  loadMessages: (
    jid: string,
    count: number,
    cursor: WAMessageCursor,
    sock: WASocket | undefined
  ) => Promise<proto.IWebMessageInfo[]>;
  loadMessage: (
    jid: string,
    id: string,
    sock: WASocket | undefined
  ) => Promise<proto.IWebMessageInfo>;
  mostRecentMessage: (
    jid: string,
    sock: WASocket | undefined
  ) => Promise<proto.IWebMessageInfo>;
  fetchImageUrl: (
    jid: string,
    sock: WASocket | undefined
  ) => Promise<string>;
  fetchGroupMetadata: (
    jid: string,
    sock: WASocket | undefined
  ) => Promise<GroupMetadata>;
  fetchBroadcastListInfo: (
    jid: string,
    sock: WASocket | undefined
  ) => Promise<GroupMetadata>;
  fetchMessageReceipts: (
    jid: string,
    messageId: string,
    sock: WASocket | undefined
  ) => Promise<proto.IUserReceipt[]>;
  readFromFile: (path: string) => void;
  writeToFile: (path: string) => void;
  toJSON: () => any;
  fromJSON: (json: any) => void;
}

export const makeInMemoryStore = (config: { logger?: any } = {}): Store => {
  const { logger: storeLogger = logger } = config;
  
  const chats: Chat[] = [];

  const contacts: { [_: string]: Contact } = {};
  const messages: { [_: string]: any } = {};
  const groupMetadata: { [_: string]: GroupMetadata } = {};
  const presences: { [id: string]: { [participant: string]: PresenceData } } = {};
  
  let state = {
    connection: "close" as WAConnectionState,
    lastDisconnect: undefined,
    isNewLogin: undefined,
    qr: undefined,
    receivedPendingNotifications: false
  };

  // Função para criar estrutura de mensagens para um chat
  const createMessageStore = (jid: string) => {
    const messagesArray: proto.IWebMessageInfo[] = [];
    
    return {
      array: messagesArray,
      get: (id: string) => messagesArray.find(msg => msg.key?.id === id),
      upsert: (item: proto.IWebMessageInfo, mode: "append" | "prepend") => {
        const existingIndex = messagesArray.findIndex(msg => msg.key?.id === item.key?.id);
        if (existingIndex >= 0) {
          messagesArray[existingIndex] = item;
        } else {
          if (mode === "prepend") {
            messagesArray.unshift(item);
          } else {
            messagesArray.push(item);
          }
        }
      },
      update: (item: proto.IWebMessageInfo) => {
        const index = messagesArray.findIndex(msg => msg.key?.id === item.key?.id);
        if (index >= 0) {
          messagesArray[index] = item;
          return true;
        }
        return false;
      },
      remove: (item: proto.IWebMessageInfo) => {
        const index = messagesArray.findIndex(msg => msg.key?.id === item.key?.id);
        if (index >= 0) {
          messagesArray.splice(index, 1);
          return true;
        }
        return false;
      },
      updateAssign: (id: string, update: Partial<proto.IWebMessageInfo>) => {
        const index = messagesArray.findIndex(msg => msg.key?.id === id);
        if (index >= 0) {
          messagesArray[index] = { ...messagesArray[index], ...update };
          return true;
        }
        return false;
      },
      clear: () => {
        messagesArray.length = 0;
      },
      filter: (contain: (item: proto.IWebMessageInfo) => boolean) => {
        const filtered = messagesArray.filter(contain);
        messagesArray.length = 0;
        messagesArray.push(...filtered);
      },
      toJSON: () => messagesArray,
      fromJSON: (newItems: proto.IWebMessageInfo[]) => {
        messagesArray.length = 0;
        messagesArray.push(...newItems);
      }
    };
  };

  // Inicializar store de mensagens para chats existentes
  const initializeMessageStore = (jid: string) => {
    if (!messages[jid]) {
      messages[jid] = createMessageStore(jid);
    }
    return messages[jid];
  };

  const bind = (ev: BaileysEventEmitter) => {
    ev.on("connection.update", (update) => {
      state = { ...state, ...update };
    });

    ev.on("chats.upsert", (chatsToUpsert) => {
      for (const chat of chatsToUpsert) {
        const existingIndex = chats.findIndex(c => c.id === chat.id);
        if (existingIndex >= 0) {
          chats[existingIndex] = chat;
        } else {
          chats.push(chat);
        }
      }
    });

    ev.on("chats.update", (updates) => {
      for (const update of updates) {
        const chatIndex = chats.findIndex(c => c.id === update.id);
        if (chatIndex >= 0) {
          Object.assign(chats[chatIndex], update);
        }
      }
    });

    ev.on("chats.delete", (deletedChats) => {
      for (const chatId of deletedChats) {
        const chatIndex = chats.findIndex(c => c.id === chatId);
        if (chatIndex >= 0) {
          chats.splice(chatIndex, 1);
        }
        delete messages[chatId];
      }
    });

    ev.on("contacts.upsert", (contactsToUpsert) => {
      for (const contact of contactsToUpsert) {
        contacts[contact.id] = contact;
      }
    });

    ev.on("contacts.update", (updates) => {
      for (const update of updates) {
        if (contacts[update.id]) {
          Object.assign(contacts[update.id], update);
        }
      }
    });

    ev.on("messages.upsert", ({ messages: newMessages, type }) => {
      for (const message of newMessages) {
        const jid = message.key.remoteJid;
        if (jid) {
          initializeMessageStore(jid);
          messages[jid].upsert(message, type === "notify" ? "prepend" : "append");
        }
      }
    });

    ev.on("messages.update", (updates) => {
      for (const update of updates) {
        const jid = update.key.remoteJid;
        if (jid && messages[jid]) {
          messages[jid].updateAssign(update.key.id, update);
        }
      }
    });

    ev.on("messages.delete", (deletions) => {
      if (Array.isArray(deletions)) {
        for (const deletion of deletions) {
          if (deletion.keys && Array.isArray(deletion.keys)) {
            const jid = deletion.keys[0]?.remoteJid;
            if (jid && messages[jid]) {
              for (const key of deletion.keys) {
                messages[jid].remove({ key } as proto.IWebMessageInfo);
              }
            }
          }
        }
      }
    });

    ev.on("groups.upsert", (groups) => {
      for (const group of groups) {
        groupMetadata[group.id] = group;
      }
    });

    ev.on("groups.update", (updates) => {
      for (const update of updates) {
        if (groupMetadata[update.id]) {
          Object.assign(groupMetadata[update.id], update);
        }
      }
    });

    ev.on("group-participants.update", (updates) => {
      if (Array.isArray(updates)) {
        for (const update of updates) {
          if (groupMetadata[update.id]) {
            const group = groupMetadata[update.id];
            if (update.action === "add") {
              group.participants.push(...update.participants.map(id => ({ id, admin: "false" })));
            } else if (update.action === "remove") {
              group.participants = group.participants.filter(p => !update.participants.includes(p.id));
            }
          }
        }
      }
    });

    ev.on("presence.update", ({ id, presences: newPresences }) => {
      presences[id] = presences[id] || {};
      Object.assign(presences[id], newPresences);
    });
  };

  const loadMessages = async (
    jid: string,
    count: number,
    cursor: WAMessageCursor,
    sock: WASocket | undefined
  ): Promise<proto.IWebMessageInfo[]> => {
    if (!sock) return [];
    
    try {
      // Retornar mensagens do store local
      initializeMessageStore(jid);
      return messages[jid].array.slice(0, count);
    } catch (error) {
      storeLogger.error("Error loading messages:", error);
      return [];
    }
  };

  const loadMessage = async (
    jid: string,
    id: string,
    sock: WASocket | undefined
  ): Promise<proto.IWebMessageInfo> => {
    if (!sock) throw new Error("Socket not available");
    
    try {
      // Buscar mensagem no store local
      initializeMessageStore(jid);
      const result = messages[jid].get(id);
      if (result) {
        return result;
      }
      throw new Error("Message not found");
    } catch (error) {
      storeLogger.error("Error loading message:", error);
      throw error;
    }
  };

  const mostRecentMessage = async (
    jid: string,
    sock: WASocket | undefined
  ): Promise<proto.IWebMessageInfo> => {
    if (!sock) throw new Error("Socket not available");
    
    try {
      // Buscar mensagem mais recente no store local
      initializeMessageStore(jid);
      const messageArray = messages[jid].array;
      if (messageArray.length > 0) {
        return messageArray[messageArray.length - 1];
      }
      throw new Error("No messages found");
    } catch (error) {
      storeLogger.error("Error loading most recent message:", error);
      throw error;
    }
  };

  const fetchImageUrl = async (
    jid: string,
    sock: WASocket | undefined
  ): Promise<string> => {
    if (!sock) throw new Error("Socket not available");
    return await sock.profilePictureUrl(jid);
  };

  const fetchGroupMetadata = async (
    jid: string,
    sock: WASocket | undefined
  ): Promise<GroupMetadata> => {
    if (!sock) throw new Error("Socket not available");
    
    try {
      const result = await sock.groupMetadata(jid);
      groupMetadata[jid] = result;
      return result;
    } catch (error) {
      storeLogger.error("Error fetching group metadata:", error);
      throw error;
    }
  };

  const fetchBroadcastListInfo = async (
    jid: string,
    sock: WASocket | undefined
  ): Promise<GroupMetadata> => {
    if (!sock) throw new Error("Socket not available");
    
    try {
      const result = await sock.groupMetadata(jid);
      groupMetadata[jid] = result;
      return result;
    } catch (error) {
      storeLogger.error("Error fetching broadcast list info:", error);
      throw error;
    }
  };

  const fetchMessageReceipts = async (
    jid: string,
    messageId: string,
    sock: WASocket | undefined
  ): Promise<proto.IUserReceipt[]> => {
    if (!sock) throw new Error("Socket not available");
    
    try {
      // Buscar receipts no store local
      initializeMessageStore(jid);
      const message = messages[jid].get(messageId);
      return message?.userReceipt || [];
    } catch (error) {
      storeLogger.error("Error fetching message receipts:", error);
      return [];
    }
  };

  const readFromFile = (filePath: string) => {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, "utf8");
        const json = JSON.parse(data);
        fromJSON(json);
        storeLogger.info(`Store loaded from ${filePath}`);
      }
    } catch (error) {
      storeLogger.error("Error reading store from file:", error);
    }
  };

  const writeToFile = (filePath: string) => {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const json = toJSON();
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
      storeLogger.info(`Store saved to ${filePath}`);
    } catch (error) {
      storeLogger.error("Error writing store to file:", error);
    }
  };

  const toJSON = () => ({
    chats,
    contacts,
    messages: Object.keys(messages).reduce((acc, jid) => {
      acc[jid] = messages[jid].toJSON();
      return acc;
    }, {} as any),
    groupMetadata,
    state,
    presences
  });

  const fromJSON = (json: any) => {
    if (json.chats) {
      chats.length = 0;
      for (const chat of json.chats) {
        const existingIndex = chats.findIndex(c => c.id === chat.id);
        if (existingIndex >= 0) {
          chats[existingIndex] = chat;
        } else {
          chats.push(chat);
        }
      }
    }
    
    if (json.contacts) {
      Object.assign(contacts, json.contacts);
    }
    
    if (json.messages) {
      Object.keys(json.messages).forEach(jid => {
        initializeMessageStore(jid);
        messages[jid].fromJSON(json.messages[jid]);
      });
    }
    
    if (json.groupMetadata) {
      Object.assign(groupMetadata, json.groupMetadata);
    }
    
    if (json.state) {
      state = { ...state, ...json.state };
    }
    
    if (json.presences) {
      Object.assign(presences, json.presences);
    }
  };

  return {
    chats,
    contacts,
    messages,
    groupMetadata,
    state,
    presences,
    bind,
    loadMessages,
    loadMessage,
    mostRecentMessage,
    fetchImageUrl,
    fetchGroupMetadata,
    fetchBroadcastListInfo,
    fetchMessageReceipts,
    readFromFile,
    writeToFile,
    toJSON,
    fromJSON
  };
};
