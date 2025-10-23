import Redis from "ioredis";
import { REDIS_URI_CONNECTION } from "../config/redis";
// import util from "util"; // REMOVIDO
import * as crypto from "crypto";

const redis = new Redis(REDIS_URI_CONNECTION);

function encryptParams(params: any) {
  const str = JSON.stringify(params);
  return crypto.createHash("sha256").update(str).digest("base64");
}

export function setFromParams(
  key: string,
  params: any,
  value: string,
  option?: string,
  optionValue?: string | number
) {
  const finalKey = `${key}:${encryptParams(params)}`;
  if (option !== undefined && optionValue !== undefined) {
    return set(finalKey, value, option, optionValue);
  }
  return set(finalKey, value);
}

export function getFromParams(key: string, params: any) {
  const finalKey = `${key}:${encryptParams(params)}`;
  return get(finalKey);
}

export function delFromParams(key: string, params: any) {
  const finalKey = `${key}:${encryptParams(params)}`;
  return del(finalKey);
}

export function set(
  key: string,
  value: string,
  option?: string,
  optionValue?: string | number
) {
  // const setPromisefy = util.promisify(redis.set).bind(redis); // REMOVIDO
  if (option !== undefined && optionValue !== undefined) {
    // CORRIGIDO: Adicionado 'as any' para o 'option'
    return redis.set(key, value, option as any, optionValue);
  }

  // CORRIGIDO: Chamada direta
  return redis.set(key, value);
}

export function get(key: string) {
  // const getPromisefy = util.promisify(redis.get).bind(redis); // REMOVIDO
  // CORRIGIDO: Chamada direta
  return redis.get(key);
}

export function getKeys(pattern: string) {
  // const getKeysPromisefy = util.promisify(redis.keys).bind(redis); // REMOVIDO
  // CORRIGIDO: Chamada direta
  return redis.keys(pattern);
}

export function del(key: string) {
  // const delPromisefy = util.promisify(redis.del).bind(redis); // REMOVIDO
  // CORRIGIDO: Chamada direta
  return redis.del(key);
}

export async function delFromPattern(pattern: string) {
  const all = await getKeys(pattern);
  for (let item of all) {
    del(item);
  }
}

export const cacheLayer = {
  set,
  setFromParams,
  get,
  getFromParams,
  getKeys,
  del,
  delFromParams,
  delFromPattern
};
