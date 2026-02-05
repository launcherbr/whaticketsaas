import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";

/**
 * Garante que uma pasta tenha permissões 777
 * Cria a pasta se não existir
 * 
 * @param folderPath - Caminho completo da pasta
 * @returns true se as permissões foram aplicadas com sucesso
 */
export const ensureFolderPermissions = (folderPath: string): boolean => {
  try {
    // Criar pasta se não existir
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true, mode: 0o777 });
      logger.info(`📁 Pasta criada com permissões 777: ${folderPath}`);
      return true;
    }
    
    // Aplicar permissões 777
    fs.chmodSync(folderPath, 0o777);
    return true;
  } catch (error) {
    logger.warn(`⚠️ Não foi possível garantir permissões em: ${folderPath}`, error);
    return false;
  }
};

/**
 * Garante que um arquivo tenha permissões 777
 * 
 * @param filePath - Caminho completo do arquivo
 * @returns true se as permissões foram aplicadas com sucesso
 */
export const ensureFilePermissions = (filePath: string): boolean => {
  try {
    if (!fs.existsSync(filePath)) {
      logger.warn(`⚠️ Arquivo não existe: ${filePath}`);
      return false;
    }
    
    fs.chmodSync(filePath, 0o777);
    return true;
  } catch (error) {
    logger.warn(`⚠️ Não foi possível alterar permissões do arquivo: ${filePath}`, error);
    return false;
  }
};

/**
 * Garante permissões da pasta de uma company específica
 * Cria a estrutura de pastas se necessário
 * 
 * @param companyId - ID da company
 * @param subFolder - Subpasta opcional (ex: "stickers", "quick")
 * @returns Caminho completo da pasta
 */
export const ensureCompanyFolderPermissions = (
  companyId: number | string,
  subFolder?: string
): string => {
  const publicFolder = path.resolve(__dirname, "..", "..", "public");
  const companyFolder = path.join(publicFolder, `company${companyId}`);
  
  // Garantir permissões da pasta da company
  ensureFolderPermissions(companyFolder);
  
  // Se há subpasta, garantir permissões dela também
  if (subFolder) {
    const fullPath = path.join(companyFolder, subFolder);
    ensureFolderPermissions(fullPath);
    return fullPath;
  }
  
  return companyFolder;
};

/**
 * Corrige permissões de uma pasta recursivamente
 * Útil para corrigir pastas antigas que não têm as permissões corretas
 * 
 * @param folderPath - Caminho da pasta
 */
export const fixPermissionsRecursively = (folderPath: string): void => {
  try {
    if (!fs.existsSync(folderPath)) {
      logger.warn(`⚠️ Pasta não existe: ${folderPath}`);
      return;
    }
    
    // Corrigir permissões da pasta principal
    ensureFolderPermissions(folderPath);
    
    // Ler itens da pasta
    const items = fs.readdirSync(folderPath);
    
    items.forEach(item => {
      const itemPath = path.join(folderPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        // Recursivamente corrigir subpastas
        fixPermissionsRecursively(itemPath);
      } else {
        // Corrigir permissões do arquivo
        ensureFilePermissions(itemPath);
      }
    });
    
    logger.info(`✅ Permissões corrigidas recursivamente: ${folderPath}`);
  } catch (error) {
    logger.error(`❌ Erro ao corrigir permissões recursivamente: ${folderPath}`, error);
  }
};

export default {
  ensureFolderPermissions,
  ensureFilePermissions,
  ensureCompanyFolderPermissions,
  fixPermissionsRecursively
};
