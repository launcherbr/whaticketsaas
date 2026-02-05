import * as Sentry from "@sentry/node";
import makeWASocket, {
  WASocket,
  Browsers,
  WAMessage,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidBroadcast,
  WAMessageKey,
  jidNormalizedUser,
  CacheStore,
  fetchLatestWaWebVersion,
  GroupMetadata
} from "baileys";
import { Op } from "sequelize";
import { FindOptions } from "sequelize/types";
import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";
import MAIN_LOGGER from "baileys/lib/Utils/logger";
import authState from "../helpers/authState";
import { Boom } from "@hapi/boom";
import AppError from "../errors/AppError";
import { getIO } from "./socket";
import { Store } from "./store";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import DeleteBaileysService from "../services/BaileysServices/DeleteBaileysService";
import { wbotMessageListener } from "../services/WbotServices/wbotMessageListener";
import wbotMonitor from "../services/WbotServices/wbotMonitor";
import NodeCache from 'node-cache';
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import { LIDMappingStore } from "baileys/lib/Signal/lid-mapping";
import { proto } from "baileys";
import { SignalDataTypeMap } from "baileys";
import GroupEncryptionService from "../services/BaileysServices/GroupEncryptionService";

const KEY_MAP: { [T in keyof SignalDataTypeMap]: string } = {
  "pre-key": "preKeys",
  session: "sessions",
  "sender-key": "senderKeys",
  "app-state-sync-key": "appStateSyncKeys",
  "app-state-sync-version": "appStateVersions",
  "sender-key-memory": "senderKeyMemory",
  "lid-mapping": "lidMapping",
  "device-list": "deviceList",
  tctoken: "tctoken"
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

const loggerBaileys = MAIN_LOGGER.child({});
loggerBaileys.level = "error";

const msgRetryCounterCache = new NodeCache({
  stdTTL: 600,
  maxKeys: 1000,
  checkperiod: 300,
  useClones: false
});

const msgCache = new NodeCache({
  stdTTL: 60,
  maxKeys: 1000,
  checkperiod: 300,
  useClones: false
});

type Session = WASocket & {
  id?: number;
  store?: Store;
};

export default function msg() {
  return {
    get: (key: WAMessageKey) => {
      const { id } = key;
      if (!id) return;
      let data = msgCache.get(id);
      if (data) {
        try {
          let msg = JSON.parse(data as string);
          return msg?.message;
        } catch (error) {
          logger.error(error);
        }
      }
    },
    save: (msg: WAMessage) => {
      const { id } = msg.key;
      const msgtxt = JSON.stringify(msg);
      try {
        msgCache.set(id as string, msgtxt);
      } catch (error) {
        logger.error(error);
      }
    }
  }
}

const sessions: Session[] = [];

const retriesQrCodeMap = new Map<number, number>();

// Contador de tentativas de reconexão para erro 403
const reconnectAttempts = new Map<number, number>();

// Rate limiting para evitar reconexões muito frequentes
const lastReconnectTime = new Map<number, number>();
const MIN_RECONNECT_INTERVAL = 10000; // 10 segundos mínimo entre reconexões

// Função helper para reconexão com rate limiting
const scheduleReconnect = (whatsapp: Whatsapp, delay: number, reason: string) => {
  const now = Date.now();
  const lastTime = lastReconnectTime.get(whatsapp.id) || 0;
  const timeSinceLastReconnect = now - lastTime;
  
  if (timeSinceLastReconnect < MIN_RECONNECT_INTERVAL) {
    const adjustedDelay = MIN_RECONNECT_INTERVAL - timeSinceLastReconnect + delay;
    logger.warn(`Rate limiting: aguardando ${adjustedDelay}ms antes de reconectar ${whatsapp.name} (${reason})`);
    delay = adjustedDelay;
  }
  
  lastReconnectTime.set(whatsapp.id, now + delay);
  
  setTimeout(() => {
    logger.info(`Iniciando reconexão para ${whatsapp.name} (${reason})`);
    StartWhatsAppSession(whatsapp, whatsapp.companyId);
  }, delay);
};

export const getWbot = (whatsappId: number): Session => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);

  if (sessionIndex === -1) {
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }
  return sessions[sessionIndex];
};

export const removeWbot = async (
  whatsappId: number,
  isLogout = true
): Promise<void> => {
  try {
    const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
    if (sessionIndex !== -1) {
      if (isLogout) {
        sessions[sessionIndex].logout();
        sessions[sessionIndex].ws.close();
      }

      sessions.splice(sessionIndex, 1);
    }
  } catch (err) {
    logger.error(err);
  }
};

export const restartWbot = async (
  companyId: number,
  session?: any
): Promise<void> => {
  try {
    const options: FindOptions = {
      where: {
        companyId,
      },
      attributes: ["id"],
    }

    const whatsapp = await Whatsapp.findAll(options);

    whatsapp.map(async c => {
      const sessionIndex = sessions.findIndex(s => s.id === c.id);
      if (sessionIndex !== -1) {
        sessions[sessionIndex].ws.close();
      }

    });

  } catch (err) {
    logger.error(err);
  }
};

export const msgDB = msg();

export const initWASocket = async (whatsapp: Whatsapp): Promise<Session> => {
  return new Promise(async (resolve, reject) => {
    try {
      (async () => {
        const io = getIO();

        const whatsappUpdate = await Whatsapp.findOne({
          where: { id: whatsapp.id }
        });

        if (!whatsappUpdate) return;

        // Verificar se já existe uma sessão ativa e se está conectado
        if (whatsappUpdate.status === "CONNECTED") {
          const existingSessionIndex = sessions.findIndex(s => s.id === whatsapp.id);
          if (existingSessionIndex !== -1) {
            const existingSession = sessions[existingSessionIndex];
            logger.info(`WhatsApp ${whatsappUpdate.name} (ID: ${whatsapp.id}) já está CONNECTED e tem sessão ativa. Reutilizando sessão existente.`);
            resolve(existingSession);
            return;
          } else {
            // Status é CONNECTED mas não há sessão na memória - pode ser um restart do servidor
            // Atualizar status para DISCONNECTED e continuar para criar nova sessão
            logger.warn(`WhatsApp ${whatsappUpdate.name} (ID: ${whatsapp.id}) está marcado como CONNECTED mas não tem sessão na memória. Atualizando status e criando nova sessão.`);
            await whatsappUpdate.update({ status: "DISCONNECTED" });
            // Continuar para criar nova sessão
          }
        } else {
          // Se não está CONNECTED, remover sessão antiga se existir
          const existingSessionIndex = sessions.findIndex(s => s.id === whatsapp.id);
          if (existingSessionIndex !== -1) {
            logger.info(`Removendo sessão antiga para ${whatsappUpdate.name} (ID: ${whatsapp.id}) antes de criar nova.`);
            await removeWbot(whatsapp.id, false);
          }
        }

        const { id, name, provider } = whatsappUpdate;

        // const { version, isLatest } = await fetchLatestWaWebVersion({});
        const { version, isLatest } = await fetchLatestBaileysVersion();
        const isLegacy = provider === "stable" ? true : false;

        logger.info(`using WA v${version.join(".")}, isLatest: ${isLatest}`);
        logger.info(`isLegacy: ${isLegacy}`);
        logger.info(`Starting session ${name}`);
        let retriesQrCode = 0;

        let wsocket: Session & {
          lidMappingStore?: LIDMappingStore;
        } = null;
        
        // Removido makeInMemoryStore que não existe mais na versão 6.7.16
        // Usando apenas caches externos conforme exemplo oficial

        const { state, saveState } = await authState(whatsapp);

        const userDevicesCache: CacheStore = new NodeCache();
        const signalKeyStore = makeCacheableSignalKeyStore(state.keys, logger, userDevicesCache);

        // Verificar e inicializar chaves Signal para grupos se necessário
        if (!state.keys) {
          logger.warn(`Chaves Signal não encontradas para ${name}, inicializando...`);
          // Forçar inicialização das chaves se não existirem
          state.keys = {
            get: (type, ids) => {
              const key = KEY_MAP[type];
              return ids.reduce((dict: any, id) => {
                let value = (state.keys as any)[key]?.[id];
                if (value) {
                  if (type === "app-state-sync-key") {
                    value = proto.Message.AppStateSyncKeyData.create(value);
                  }
                  dict[id] = value;
                }
                return dict;
              }, {});
            },
            set: (data: any) => {
              for (const i in data) {
                const key = KEY_MAP[i as keyof SignalDataTypeMap];
                (state.keys as any)[key] = (state.keys as any)[key] || {};
                Object.assign((state.keys as any)[key], data[i]);
              }
              saveState();
            }
          };
        }

        const groupCache = new NodeCache({
          stdTTL: 3600,
          maxKeys: 10000,
          checkperiod: 600,
          useClones: false
        })

         const lidMappingStore = new LIDMappingStore(
          signalKeyStore as any,
          logger
        );

        const cachedGroupMetadata = async (jid: string):  Promise<GroupMetadata> => {
            let data:GroupMetadata = groupCache.get(jid);
            console.log('cachedGroupMetadata jid:', jid, 'data:', !!data);
            if (data) {
              return data;
            } else {
              const result = await wsocket.groupMetadata(jid);
              groupCache.set(jid, result);
              return result;
            }
        };

        wsocket = makeWASocket({
          logger: loggerBaileys,
          printQRInTerminal: false,
          auth: {
            creds: state.creds,
            keys: signalKeyStore,
          },
          version,
          browser: Browsers.appropriate("Desktop"),
          defaultQueryTimeoutMs: undefined,
          msgRetryCounterCache,
          markOnlineOnConnect: false,
          connectTimeoutMs: 25_000,
          retryRequestDelayMs: 500,
          getMessage: msgDB.get,
          emitOwnEvents: true,
          fireInitQueries: true,
          transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
          shouldIgnoreJid: jid => isJidBroadcast(jid),
          cachedGroupMetadata,
        });


        

        // PATCH ESPECÍFICO - Converter objetos Object() para Buffer
        const originalBufferFrom = Buffer.from;
        Buffer.from = function(value: any, ...args: any[]) {
          try {
            // Interceptar APENAS objetos Object() que não são válidos para Buffer.from
            if (typeof value === 'object' && value !== null && 
                !Array.isArray(value) && 
                !Buffer.isBuffer(value) && 
                !(value instanceof Uint8Array) &&  // NÃO interceptar Uint8Array
                !(value instanceof ArrayBuffer) &&  // NÃO interceptar ArrayBuffer
                value.constructor === Object) {     // APENAS objetos Object()
              
              // Tentar converter o objeto Object() para array e depois para Buffer
              try {
                const keys = Object.keys(value);
                const isNumericKeys = keys.every(key => /^\d+$/.test(key));
                
                if (isNumericKeys && keys.length > 0) {
                  // Converter objeto com chaves numéricas para array
                  const maxIndex = Math.max(...keys.map(k => parseInt(k)));
                  const array = new Array(maxIndex + 1);
                  
                  for (let i = 0; i <= maxIndex; i++) {
                    array[i] = value[i] || 0;
                  }
                  
                  const buffer = Buffer.from(array);
                  return buffer;
                } else {
                  return originalBufferFrom.call(this, value, ...args);
                }
              } catch (conversionError) {
                return originalBufferFrom.call(this, value, ...args);
              }
            }
            
            return originalBufferFrom.call(this, value, ...args);
          } catch (error) {
            return originalBufferFrom.call(this, value, ...args);
          }
        };

        wsocket.ev.on(
          "connection.update",
          async ({ connection, lastDisconnect, qr }) => {
            logger.info(`Socket ${name} Connection Update: ${connection}`);
            
            // Log detalhado de desconexões
            if (lastDisconnect) {
              const error = lastDisconnect.error as Boom;
              const statusCode = error?.output?.statusCode;
              const errorMessage = error?.message;
              
              logger.warn(`Desconexão detectada para ${name}:`, {
                statusCode,
                message: errorMessage,
                timestamp: new Date().toISOString()
              });

              // Tratamento específico para erros de stream do Baileys
              if (statusCode === 515) {
                logger.warn(`Erro 515 (stream errored) para ${name} - Problema de rede, tentando reconexão rápida`);
              } else if (statusCode === 401) {
                logger.warn(`Erro 401 (device_removed) para ${name} - Dispositivo removido, aguardando QR`);
              }
            }

            const disconect = (lastDisconnect?.error as Boom)?.output?.statusCode;

            if (connection === "close") {
              // Tratamento específico para diferentes tipos de erro
              if (disconect === 515) {
                // Erro 515: stream errored - problema de rede, reconexão rápida
                logger.warn(`Erro 515 (stream) para ${name} - Reconexão rápida`);
                removeWbot(id, false);
                scheduleReconnect(whatsapp, 3000, "erro 515 - stream");
                return;
              }
              
              if (disconect === 401) {
                // Erro 401: device_removed - dispositivo foi removido, precisa de novo QR
                logger.warn(`Erro 401 (device_removed) para ${name} - Limpando sessão para novo QR`);
                await whatsapp.update({ status: "PENDING", session: "", number: "" });
                removeWbot(id, false);
                await DeleteBaileysService(whatsapp.id);
                
                io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                  action: "update",
                  session: whatsapp
                });
                
                scheduleReconnect(whatsapp, 5000, "erro 401 - device_removed");
                return;
              }
              
              if (disconect === 403) {
                logger.warn(`Erro 403 detectado para ${name}. Tentando reconexão inteligente...`);
                
                // NÃO deletar dados imediatamente - tentar reconectar primeiro
                const attempts = reconnectAttempts.get(id) || 0;
                
                if (attempts < 5) { // Máximo 5 tentativas
                  logger.info(`Tentativa ${attempts + 1} de reconexão para ${name}`);
                  reconnectAttempts.set(id, attempts + 1);
                  
                  // Tentar reconectar sem deletar dados
                  const delay = [2000, 5000, 10000, 30000, 60000][attempts];
                  scheduleReconnect(whatsapp, delay, `erro 403 - tentativa ${attempts + 1}`);
                  
                  return; // NÃO deletar dados ainda
                } else {
                  // Após 5 tentativas, então deletar dados
                  logger.error(`Máximo de tentativas atingido para ${name}. Deletando sessão.`);
                  await whatsapp.update({ status: "PENDING", session: "", number: "" });
                  removeWbot(id, false);
                  await DeleteBaileysService(whatsapp.id);
                  reconnectAttempts.delete(id);
                  
                  io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: whatsapp
                  });
                }
              }

              if (disconect !== DisconnectReason.loggedOut) {
                removeWbot(id, false);
                scheduleReconnect(whatsapp, 2000, "disconnect geral");
              } else {
                await whatsapp.update({ status: "PENDING", session: "", number: "" });
                await DeleteBaileysService(whatsapp.id);

                io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                  action: "update",
                  session: whatsapp
                });
                removeWbot(id, false);
                scheduleReconnect(whatsapp, 2000, "loggedOut");
              }
            }

            if (connection === "open") {
              // Limpar tentativas de reconexão e rate limiting quando conectar com sucesso
              reconnectAttempts.delete(id);
              lastReconnectTime.delete(id);
              
              await whatsapp.update({
                status: "CONNECTED",
                qrcode: "",
                retries: 0,
                number:
                  wsocket.type === "md"
                    ? jidNormalizedUser((wsocket as WASocket).user.id).split("@")[0]
                    : "-"
              });

                io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                  action: "update",
                  session: whatsapp
                });

              const sessionIndex = sessions.findIndex(
                s => s.id === whatsapp.id
              );
              const isReconnection = sessionIndex !== -1;
              
              if (sessionIndex === -1) {
                wsocket.id = whatsapp.id;
                sessions.push(wsocket);
              } else {
                // Atualizar sessão existente
                sessions[sessionIndex] = wsocket;
              }

              // Se for uma reconexão (sessão já existia), re-registrar listeners
              if (isReconnection) {
                logger.info(`Reconexão detectada para ${name} (ID: ${id}). Re-registrando listeners...`);
                // Aguardar um pouco para garantir que a conexão está estável
                setTimeout(async () => {
                  try {
                    await wbotMessageListener(wsocket, whatsapp.companyId);
                    await wbotMonitor(wsocket, whatsapp, whatsapp.companyId);
                    logger.info(`Listeners re-registrados com sucesso para ${name} (ID: ${id})`);
                  } catch (err) {
                    logger.error(`Erro ao re-registrar listeners para ${name}: ${err}`);
                    Sentry.captureException(err);
                  }
                }, 1000);
              } else {
                logger.info(`Conexão inicial estabelecida para ${name} (ID: ${id}). Listeners serão registrados pelo StartWhatsAppSession.`);
              }

              resolve(wsocket);
            }

            if (qr !== undefined) {
              if (retriesQrCodeMap.get(id) && retriesQrCodeMap.get(id) >= 3) {
                await whatsapp.update({
                  status: "DISCONNECTED",
                  qrcode: ""
                });
                await DeleteBaileysService(whatsapp.id);

                io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                  action: "update",
                  session: whatsapp
                });
                wsocket.ev.removeAllListeners("connection.update");
                wsocket.ws.close();
                wsocket = null;
                retriesQrCodeMap.delete(id);
              } else {
                logger.info(`Session QRCode Generate ${name}`);
                retriesQrCodeMap.set(id, (retriesQrCode += 1));

                await whatsapp.update({
                  qrcode: qr,
                  status: "qrcode",
                  retries: 0,
                  number: ""
                });
                const sessionIndex = sessions.findIndex(
                  s => s.id === whatsapp.id
                );

                if (sessionIndex === -1) {
                  wsocket.id = whatsapp.id;
                  sessions.push(wsocket);
                }

                io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                  action: "update",
                  session: whatsapp
                });
              }
            }
          }
        );
        wsocket.ev.on("creds.update", saveState);

        // Tratamento específico para erros de criptografia de grupos
        wsocket.ev.on("messages.upsert", async (m) => {
          try {
            // Log para debug de mensagens de grupo
            if (m.messages && m.messages.length > 0) {
              const firstMsg = m.messages[0];
              if (firstMsg.key.remoteJid?.endsWith("@g.us")) {
                logger.debug(`Mensagem de grupo recebida: ${firstMsg.key.remoteJid}`);
              }
            }
          } catch (error) {
            logger.error("Erro ao processar mensagem de grupo:", error);
            
            // Tentar tratar erro de criptografia se for mensagem de grupo
            if (m.messages && m.messages.length > 0) {
              const firstMsg = m.messages[0];
              if (firstMsg.key.remoteJid?.endsWith("@g.us")) {
                await GroupEncryptionService.handleGroupEncryptionError(
                  error,
                  firstMsg.key.remoteJid,
                  wsocket
                );
              }
            }
          }
        });

        // Interceptar erros globais de criptografia
        const originalSendMessage = wsocket.sendMessage;
        wsocket.sendMessage = async (jid: string, content: any, options?: any) => {
          try {
            return await originalSendMessage.call(wsocket, jid, content, options);
          } catch (error) {
            // Se for erro de criptografia em grupo, tentar tratar
            if (jid.endsWith("@g.us")) {
              const handled = await GroupEncryptionService.handleGroupEncryptionError(
                error,
                jid,
                wsocket
              );
              
              if (handled) {
                // Tentar enviar novamente após tratamento
                try {
                  return await originalSendMessage.call(wsocket, jid, content, options);
                } catch (retryError) {
                  logger.error(`Erro persistente ao enviar mensagem para grupo ${jid}:`, retryError);
                  throw retryError;
                }
              }
            }
            
            throw error;
          }
        };

        wsocket.ev.on(
          "presence.update",
          async ({ id: remoteJid, presences }) => {
            try {
              logger.debug(
                { remoteJid, presences },
                "Received contact presence"
              );
              if (!presences[remoteJid]?.lastKnownPresence) {
                return;
              }
              const contact = await Contact.findOne({
                where: {
                  number: extractPhoneNumber(remoteJid),
                  companyId: whatsapp.companyId
                }
              });
              if (!contact) {
                return;
              }
              const ticket = await Ticket.findOne({
                where: {
                  contactId: contact.id,
                  whatsappId: whatsapp.id,
                  status: {
                    [Op.or]: ["open", "pending"]
                  }
                }
              });

              if (ticket) {
                io.to(ticket.id.toString())
                  .to(`company-${whatsapp.companyId}-${ticket.status}`)
                  .to(`queue-${ticket.queueId}-${ticket.status}`)
                  .emit(`company-${whatsapp.companyId}-presence`, {
                    ticketId: ticket.id,
                    presence: presences[remoteJid].lastKnownPresence
                  });
              }
            } catch (error) {
              logger.error(
                { remoteJid, presences },
                "presence.update: error processing"
              );
              if (error instanceof Error) {
                logger.error(`Error: ${error.name} ${error.message}`);
              } else {
                logger.error(`Error was object of type: ${typeof error}`);
              }
            }
          }
        );

         wsocket.lidMappingStore = lidMappingStore;

        // Removida a linha que vinculava o store ao socket
        // store.bind(wsocket.ev);
      })();
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
      reject(error);
    }
  });
};