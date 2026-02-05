import path from "path";
import multer from "multer";
import fs from "fs";
import Whatsapp from "../models/Whatsapp";
import AppError from "../errors/AppError";
import { ensureFolderPermissions } from "../helpers/EnsurePermissions";

const publicFolder = path.resolve(__dirname, "..", "..", "public");

export default {
  directory: publicFolder,
  storage: multer.diskStorage({
    destination: async function (req, file, cb) {
      let companyId;

      if (req.user?.companyId) {
        companyId = req.user.companyId;
      } else {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          throw new AppError("Acesso não permitido", 401);
        }
        const token = authHeader.replace(/^Bearer\s+/i, "").trim();
        if (!token) {
          throw new AppError("Acesso não permitido", 401);
        }
        const whatsapp = await Whatsapp.findOne({ where: { token } });
        if (!whatsapp) {
          throw new AppError("Acesso não permitido", 401);
        }
        companyId = whatsapp.companyId;
      }

      const companyFolder = `${publicFolder}/company${companyId}`;
      const folder = `${companyFolder}/quick/`;

      // Criar pastas e garantir permissões corretas
      ensureFolderPermissions(companyFolder);
      ensureFolderPermissions(folder);

      return cb(null, folder);
    },
    filename(req, file, cb) {
      const fileName = `${new Date().getTime()}_${file.originalname.replace("/", "-")}`;
      return cb(null, fileName);
    }
  })
};