import * as fs from "fs";
import * as path from "path";
import AppError from "../../errors/AppError";

// O diretório de backups fica dentro do backend
const BACKEND_ROOT = process.cwd();
const BACKUP_DIR = path.join(BACKEND_ROOT, "backups");

const DownloadBackupService = async (backupId: string): Promise<string> => {
  const backupPath = path.join(BACKUP_DIR, `${backupId}.zip`);

  if (!fs.existsSync(backupPath)) {
    throw new AppError("Backup não encontrado", 404);
  }

  return backupPath;
};

export default DownloadBackupService;

