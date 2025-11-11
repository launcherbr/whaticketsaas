import { logger } from "../../utils/logger";
import { WASocket } from "baileys";

export class GroupEncryptionService {
  private static instance: GroupEncryptionService;
  private retryAttempts = new Map<string, number>();
  private readonly MAX_RETRIES = 3;

  private constructor() {}

  public static getInstance(): GroupEncryptionService {
    if (!GroupEncryptionService.instance) {
      GroupEncryptionService.instance = new GroupEncryptionService();
    }
    return GroupEncryptionService.instance;
  }

  /**
   * Trata erros de criptografia de grupos
   */
  public async handleGroupEncryptionError(
    error: any,
    groupJid: string,
    wbot: WASocket
  ): Promise<boolean> {
    const errorMessage = error?.message || "";
    
    // Verificar se é erro de chave privada
    if (errorMessage.includes("Incorrect private key length: 0")) {
      logger.warn(`Erro de chave privada para grupo ${groupJid}: ${errorMessage}`);
      
      // Tentar regenerar chaves para o grupo
      return await this.regenerateGroupKeys(groupJid, wbot);
    }
    
    // Verificar se é erro de criptografia geral
    if (errorMessage.includes("GroupCipher") || errorMessage.includes("SenderKeyMessage")) {
      logger.warn(`Erro de criptografia para grupo ${groupJid}: ${errorMessage}`);
      
      // Tentar limpar cache e regenerar
      return await this.clearGroupCacheAndRetry(groupJid, wbot);
    }
    
    return false;
  }

  /**
   * Regenera chaves para um grupo específico
   */
  private async regenerateGroupKeys(groupJid: string, wbot: WASocket): Promise<boolean> {
    try {
      const retryKey = `group_${groupJid}`;
      const attempts = this.retryAttempts.get(retryKey) || 0;
      
      if (attempts >= this.MAX_RETRIES) {
        logger.error(`Máximo de tentativas atingido para regenerar chaves do grupo ${groupJid}`);
        this.retryAttempts.delete(retryKey);
        return false;
      }
      
      this.retryAttempts.set(retryKey, attempts + 1);
      
      logger.info(`Tentativa ${attempts + 1} de regenerar chaves para grupo ${groupJid}`);
      
      // Tentar obter metadados do grupo para forçar regeneração de chaves
      try {
        await wbot.groupMetadata(groupJid);
        logger.info(`Metadados do grupo ${groupJid} obtidos com sucesso`);
      } catch (metadataError) {
        logger.warn(`Erro ao obter metadados do grupo ${groupJid}:`, metadataError);
      }
      
      // Aguardar um pouco antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return true;
    } catch (error) {
      logger.error(`Erro ao regenerar chaves para grupo ${groupJid}:`, error);
      return false;
    }
  }

  /**
   * Limpa cache do grupo e tenta novamente
   */
  private async clearGroupCacheAndRetry(groupJid: string, wbot: WASocket): Promise<boolean> {
    try {
      logger.info(`Limpando cache para grupo ${groupJid}`);
      
      // Limpar cache de metadados do grupo se existir
      if ((wbot as any).groupCache) {
        (wbot as any).groupCache.del(groupJid);
      }
      
      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      logger.error(`Erro ao limpar cache do grupo ${groupJid}:`, error);
      return false;
    }
  }

  /**
   * Limpa tentativas de retry para um grupo
   */
  public clearRetryAttempts(groupJid: string): void {
    const retryKey = `group_${groupJid}`;
    this.retryAttempts.delete(retryKey);
  }

  /**
   * Limpa todas as tentativas de retry
   */
  public clearAllRetryAttempts(): void {
    this.retryAttempts.clear();
  }
}

export default GroupEncryptionService.getInstance();
