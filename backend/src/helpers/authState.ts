import type {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataTypeMap
} from "libzapitu-rf";
import { BufferJSON, initAuthCreds, proto } from "libzapitu-rf";
import Whatsapp from "../models/Whatsapp";
import { cacheLayer } from "../libs/cache";
import { logger } from "../utils/logger";

const KEY_MAP: { [T in keyof SignalDataTypeMap]: string } = {
  "pre-key": "preKeys",
  session: "sessions",
  "sender-key": "senderKeys",
  "app-state-sync-key": "appStateSyncKeys",
  "app-state-sync-version": "appStateVersions",
  "sender-key-memory": "senderKeyMemory",
  "contacts-tc-token": "contactsTcToken"
};

const authState = async (
  whatsapp: Whatsapp
): Promise<{ state: AuthenticationState; saveState: () => void }> => {
  let creds: AuthenticationCreds;
  const whatsappId = whatsapp.id;

  const getRedisKey = (type: string, id: string) =>
    `sessions:${whatsappId}:${type}-${id}`;

  const saveKey = async (type: string, id: string, value: any) => {
    await cacheLayer.set(
      getRedisKey(type, id),
      JSON.stringify(value, BufferJSON.replacer)
    );
  };

  const getKey = async (type: string, id: string) => {
    const value = await cacheLayer.get(getRedisKey(type, id));

    if (!value) {
      return null;
    }

    return JSON.parse(value, BufferJSON.reviver);
  };

  const removeKey = async (type: string, id: string) => {
    await cacheLayer.del(getRedisKey(type, id));
  };

  const saveState = async () => {
    try {
      await whatsapp.update({
        session: JSON.stringify({ creds, keys: {} }, BufferJSON.replacer, 0)
      });
    } catch (error) {
      console.log(error);
    }
  };

  const migrateLegacyKeys = async (legacyKeys: Record<string, any>) => {
    const categories = Object.keys(legacyKeys || {});

    if (!categories.length) {
      return;
    }

    logger.info(
      `Migrando chaves legadas do WhatsApp ${whatsappId} para armazenamento em Redis`
    );

    const tasks: Promise<unknown>[] = [];

    for (const category of categories) {
      const entries = legacyKeys[category] || {};

      for (const id of Object.keys(entries)) {
        tasks.push(saveKey(category, id, entries[id]));
      }
    }

    await Promise.all(tasks);
  };

  if (whatsapp.session && whatsapp.session !== null) {
    const result = JSON.parse(whatsapp.session, BufferJSON.reviver);
    if (result.creds) {
      creds = result.creds;
      if (result.keys && Object.keys(result.keys).length > 0) {
        await migrateLegacyKeys(result.keys);
        await saveState();
      }
    } else {
      creds = initAuthCreds();
    }
  } else {
    creds = initAuthCreds();
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: Record<string, any> = {};

          await Promise.all(
            ids.map(async id => {
              let value = await getKey(type, id);

              if (value) {
                if (type === "app-state-sync-key") {
                  value = proto.Message.AppStateSyncKeyData.create(value);
                }

                data[id] = value;
              }

              if (!value) {
                data[id] = value;
              }
            })
          );

          return data;
        },
        set: async (data: any) => {
          const tasks: Promise<unknown>[] = [];

          for (const category in data) {
            const key = KEY_MAP[category as keyof SignalDataTypeMap];

            if (!key) {
              continue;
            }

            for (const id in data[category]) {
              const value = data[category][id];
              tasks.push(value ? saveKey(category, id, value) : removeKey(category, id));
            }
          }

          await Promise.all(tasks);
          await saveState();
        }
      }
    },
    saveState
  };
};

export default authState;
