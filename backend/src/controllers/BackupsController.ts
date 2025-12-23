import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import AppError from "../errors/AppError";
import CreateBackupService from "../services/BackupServices/CreateBackupService";
import ListBackupsService from "../services/BackupServices/ListBackupsService";
import DeleteBackupService from "../services/BackupServices/DeleteBackupService";
import DownloadBackupService from "../services/BackupServices/DownloadBackupService";
import { logger } from "../utils/logger";

type IndexQuery = {
  pageNumber?: string | number;
  searchParam?: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { pageNumber, searchParam } = req.query as IndexQuery;

  const { backups, count, hasMore } = await ListBackupsService({
    pageNumber,
    searchParam
  });

  return res.json({ backups, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const backupId = await CreateBackupService();

  const io = getIO();
  io.emit("backup-progress", {
    backupId,
    progress: 0,
    status: "started"
  });

  // Inicia o backup em background
  CreateBackupService.processBackup(backupId).catch((error) => {
    logger.error(`Error processing backup ${backupId}:`, error);
    io.emit("backup-progress", {
      backupId,
      progress: 0,
      status: "error",
      error: error.message
    });
  });

  return res.json({ backupId, message: "Backup iniciado" });
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { backupId } = req.params;

  await DeleteBackupService(backupId);

  return res.status(200).json({ message: "Backup excluído com sucesso" });
};

export const download = async (req: Request, res: Response): Promise<void> => {
  const { backupId } = req.params;

  const filePath = await DownloadBackupService(backupId);

  res.download(filePath, (err) => {
    if (err) {
      logger.error(`Error downloading backup ${backupId}:`, err);
      throw new AppError("Erro ao fazer download do backup", 500);
    }
  });
};

