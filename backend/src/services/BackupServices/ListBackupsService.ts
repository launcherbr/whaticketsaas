import * as fs from "fs";
import * as path from "path";
import { Op } from "sequelize";

// O diretório de backups fica dentro do backend
const BACKEND_ROOT = process.cwd();
const BACKUP_DIR = path.join(BACKEND_ROOT, "backups");

interface BackupInfo {
  id: string;
  name: string;
  size: number;
  createdAt: Date;
}

interface Request {
  pageNumber?: number | string;
  searchParam?: string;
}

interface Response {
  backups: BackupInfo[];
  count: number;
  hasMore: boolean;
}

const ListBackupsService = async ({
  pageNumber = 1,
  searchParam = ""
}: Request): Promise<Response> => {
  if (!fs.existsSync(BACKUP_DIR)) {
    return { backups: [], count: 0, hasMore: false };
  }

  const files = fs.readdirSync(BACKUP_DIR);
  const backupFiles = files.filter((file) => file.endsWith(".zip"));

  const backups: BackupInfo[] = backupFiles
    .map((file) => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const id = file.replace(".zip", "");

      return {
        id,
        name: file,
        size: stats.size,
        createdAt: stats.birthtime
      };
    })
    .filter((backup) => {
      if (!searchParam) return true;
      return backup.name.toLowerCase().includes(searchParam.toLowerCase());
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const page = Number(pageNumber) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const total = backups.length;

  const paginatedBackups = backups.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  return {
    backups: paginatedBackups,
    count: total,
    hasMore
  };
};

export default ListBackupsService;

