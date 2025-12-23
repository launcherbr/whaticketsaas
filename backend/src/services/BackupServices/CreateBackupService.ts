import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { createWriteStream } from "fs";
import archiver from "archiver";
import { getIO } from "../../libs/socket";
import { logger } from "../../utils/logger";

const execAsync = promisify(exec);

interface BackupProgress {
  backupId: string;
  progress: number;
  status: string;
  error?: string;
}

// O diretório de backups fica dentro do backend para evitar problemas de permissão
const BACKEND_ROOT = process.cwd();
const BACKUP_DIR = path.join(BACKEND_ROOT, "backups");
const PROJECT_ROOT = path.resolve(BACKEND_ROOT, "..");

// Garante que o diretório de backups existe
const ensureBackupDir = () => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o755 });
    }
  } catch (error: any) {
    logger.error(`Erro ao criar diretório de backups: ${error.message}`);
    throw new Error(`Não foi possível criar o diretório de backups: ${error.message}`);
  }
};

// Cria o diretório na inicialização
ensureBackupDir();

const emitProgress = (backupId: string, progress: number, status: string, message?: string) => {
  const io = getIO();
  const progressData: BackupProgress = {
    backupId,
    progress,
    status
  };
  
  // Só adiciona error se o status for "error"
  if (status === "error" && message) {
    progressData.error = message;
  }
  
  io.emit("backup-progress", progressData);
};

const CreateBackupService = async (): Promise<string> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupId = `backup-${timestamp}`;
  return backupId;
};

CreateBackupService.processBackup = async (backupId: string): Promise<void> => {
  // Garante que o diretório existe antes de começar
  ensureBackupDir();
  
  const tempDir = path.join(BACKUP_DIR, backupId);
  const zipPath = path.join(BACKUP_DIR, `${backupId}.zip`);

  try {
    // Cria diretório temporário
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true, mode: 0o755 });
    }

    emitProgress(backupId, 5, "preparing");

    // 1. Backup do banco de dados (10%)
    emitProgress(backupId, 10, "database");
    await backupDatabase(tempDir, backupId);
    emitProgress(backupId, 30, "database");

    // 2. Backup do backend (40%)
    emitProgress(backupId, 35, "backend");
    await backupBackend(tempDir);
    emitProgress(backupId, 60, "backend");

    // 3. Backup do frontend (70%)
    emitProgress(backupId, 65, "frontend");
    await backupFrontend(tempDir);
    emitProgress(backupId, 85, "frontend");

    // 4. Criar ZIP (90%)
    emitProgress(backupId, 90, "compressing");
    
    // Verifica se o diretório temporário existe e tem conteúdo
    if (!fs.existsSync(tempDir)) {
      logger.error(`Diretório temporário não encontrado: ${tempDir}`);
      throw new Error("Diretório temporário não encontrado para compressão");
    }
    
    const tempDirContents = fs.readdirSync(tempDir);
    logger.info(`Conteúdo do diretório temporário: ${tempDirContents.join(", ")}`);
    
    if (tempDirContents.length === 0) {
      logger.error("Nenhum arquivo encontrado no diretório temporário para comprimir");
      throw new Error("Nenhum arquivo encontrado para comprimir");
    }
    
    logger.info(`Iniciando compressão de ${tempDir} para ${zipPath}`);
    await createZip(tempDir, zipPath);
    logger.info(`Compressão concluída com sucesso: ${zipPath}`);

    // Verifica se o arquivo ZIP foi criado
    if (!fs.existsSync(zipPath)) {
      throw new Error("Falha ao criar arquivo ZIP");
    }

    // 5. Limpar diretório temporário
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (cleanupError: any) {
      logger.warn(`Erro ao limpar diretório temporário: ${cleanupError.message}`);
      // Não falha o backup se não conseguir limpar
    }

    emitProgress(backupId, 100, "completed");

    logger.info(`Backup ${backupId} concluído com sucesso`);
  } catch (error: any) {
    logger.error(`Erro ao processar backup ${backupId}:`, error);
    emitProgress(backupId, 0, "error", error.message || "Erro desconhecido");
    
    // Limpa arquivos em caso de erro
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
    
    throw error;
  }
};

const backupDatabase = async (tempDir: string, backupId: string): Promise<void> => {
  const dbConfig = require("../../config/database");
  const dbBackupPath = path.join(tempDir, "database");
  
  if (!fs.existsSync(dbBackupPath)) {
    fs.mkdirSync(dbBackupPath, { recursive: true });
  }

  const dbFile = path.join(dbBackupPath, `${backupId}.sql`);

  try {
    if (dbConfig.dialect === "mysql") {
      const command = `mysqldump -h ${dbConfig.host} -P ${dbConfig.port || 3306} -u ${dbConfig.username} -p${dbConfig.password} ${dbConfig.database} > ${dbFile}`;
      await execAsync(command);
    } else if (dbConfig.dialect === "postgres") {
      const command = `PGPASSWORD=${dbConfig.password} pg_dump -h ${dbConfig.host} -p ${dbConfig.port || 5432} -U ${dbConfig.username} -d ${dbConfig.database} -f ${dbFile}`;
      await execAsync(command);
    } else {
      throw new Error(`Dialeto de banco de dados não suportado: ${dbConfig.dialect}`);
    }
  } catch (error: any) {
    logger.error("Erro ao fazer backup do banco de dados:", error);
    // Tenta método alternativo usando Sequelize
    throw new Error("Não foi possível fazer backup do banco de dados. Certifique-se de que mysqldump/pg_dump está instalado.");
  }
};

const backupBackend = async (tempDir: string): Promise<void> => {
  const backendDir = path.join(tempDir, "backend");
  const backendSource = path.join(PROJECT_ROOT, "backend");

  if (!fs.existsSync(backendSource)) {
    logger.warn(`Diretório backend não encontrado: ${backendSource}`);
    return;
  }

  if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
  }

  await copyDirectory(backendSource, backendDir, [
    "node_modules",
    "dist",
    ".git",
    "backups",
    "*.log",
    ".env"
  ]);
};

const backupFrontend = async (tempDir: string): Promise<void> => {
  const frontendDir = path.join(tempDir, "frontend");
  const frontendSource = path.join(PROJECT_ROOT, "frontend");

  if (!fs.existsSync(frontendSource)) {
    logger.warn(`Diretório frontend não encontrado: ${frontendSource}`);
    return;
  }

  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  await copyDirectory(frontendSource, frontendDir, [
    "node_modules",
    ".git",
    "build",
    "dist",
    "*.log",
    ".env"
  ]);
};

const copyDirectory = async (
  src: string,
  dest: string,
  excludePatterns: string[] = []
): Promise<void> => {
  if (!fs.existsSync(src)) {
    return;
  }

  const items = fs.readdirSync(src);

  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    // Verifica se deve ser excluído
    const shouldExclude = excludePatterns.some((pattern) => {
      if (pattern.includes("*")) {
        const regex = new RegExp(pattern.replace("*", ".*"));
        return regex.test(item);
      }
      return item === pattern;
    });

    if (shouldExclude) {
      continue;
    }

    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      await copyDirectory(srcPath, destPath, excludePatterns);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

const createZip = async (sourceDir: string, zipPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Verifica se o diretório fonte existe
      if (!fs.existsSync(sourceDir)) {
        reject(new Error(`Diretório fonte não existe: ${sourceDir}`));
        return;
      }

      const output = createWriteStream(zipPath);
      const archive = archiver("zip", {
        zlib: { level: 9 }
      });

      let hasError = false;

      output.on("error", (err) => {
        if (!hasError) {
          hasError = true;
          logger.error(`Erro ao escrever arquivo ZIP: ${err.message}`);
          reject(new Error(`Erro ao escrever arquivo ZIP: ${err.message}`));
        }
      });

      output.on("close", () => {
        if (!hasError) {
          const fileSize = archive.pointer();
          logger.info(`Arquivo ZIP criado: ${zipPath} (${fileSize} bytes)`);
          
          // Verifica se o arquivo foi criado e tem tamanho
          if (fs.existsSync(zipPath)) {
            const stats = fs.statSync(zipPath);
            if (stats.size === 0) {
              reject(new Error("Arquivo ZIP criado está vazio"));
              return;
            }
          }
          
          resolve();
        }
      });

      archive.on("error", (err) => {
        if (!hasError) {
          hasError = true;
          logger.error(`Erro ao comprimir arquivos: ${err.message}`);
          reject(new Error(`Erro ao comprimir arquivos: ${err.message}`));
        }
      });

      archive.on("warning", (err) => {
        if (err.code === "ENOENT") {
          logger.warn(`Aviso ao comprimir: ${err.message}`);
        } else {
          logger.warn(`Aviso do archiver: ${err.message}`);
        }
      });

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    } catch (error: any) {
      reject(new Error(`Erro ao iniciar compressão: ${error.message}`));
    }
  });
};

export default CreateBackupService;

