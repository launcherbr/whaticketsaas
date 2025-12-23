import * as fs from "fs";
import * as path from "path";
import AppError from "../../errors/AppError";

// O diretório de backups fica dentro do backend
const BACKEND_ROOT = process.cwd();
const BACKUP_DIR = path.join(BACKEND_ROOT, "backups");

const DeleteBackupService = async (backupId: string): Promise<void> => {
  const backupPath = path.join(BACKUP_DIR, `${backupId}.zip`);

  if (!fs.existsSync(backupPath)) {
    throw new AppError("Backup não encontrado", 404);
  }

  try {
    fs.unlinkSync(backupPath);
  } catch (error: any) {
    throw new AppError(`Erro ao excluir backup: ${error.message}`, 500);
  }
};

export default DeleteBackupService;

