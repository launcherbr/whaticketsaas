import path from "path";
import multer from "multer";
import fs from "fs";
import Whatsapp from "../models/Whatsapp";
import { isEmpty, isNil } from "lodash";
import AppError from "../errors/AppError";
import { ensureFolderPermissions } from "../helpers/EnsurePermissions";

const publicFolder = path.resolve(__dirname, "..", "..", "public");

export default {
  directory: publicFolder,
  storage: multer.diskStorage({
    destination: async function (req, file, cb) {

      let companyId;
      companyId = req.user?.companyId
      const { typeArch, fileId } = req.body;

      if (companyId === undefined && isNil(companyId) && isEmpty(companyId)) {
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
      let folder;

      if (typeArch && typeArch === "stickers") {
        // Stickers salvos manualmente vão para company${companyId}/stickers/salvos
        folder = path.resolve(publicFolder, `company${companyId}`, "stickers", "salvos")
      } else if (typeArch && typeArch !== "announcements" && typeArch !== "logo") {
        folder = path.resolve(publicFolder, `company${companyId}`, typeArch, fileId ? fileId : "")
      } else if (typeArch && typeArch === "announcements") {
        folder = path.resolve(publicFolder, typeArch)
      } else if (typeArch === "logo") {
        folder = path.resolve(publicFolder)
      }
      else {
        folder = path.resolve(publicFolder, `company${companyId}`)
      }

      // Criar pasta se não existir E sempre garantir permissões corretas
      ensureFolderPermissions(folder);
      
      return cb(null, folder);
    },
    filename(req, file, cb) {
      const { typeArch } = req.body;

      // Para stickers, usar timestamp + nome original PRESERVANDO a extensão original
      if (typeArch === "stickers") {
        const timestamp = new Date().getTime();
        // Preservar extensão original (gif, png, webp, etc)
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9._-]/g, '_').replace('/', '-');
        // Manter a extensão original (não converter)
        const fileName = `${timestamp}_${sanitizedName}${ext}`;
        return cb(null, fileName);
      }
      
      const fileName = typeArch && typeArch !== "announcements" ? file.originalname.replace('/', '-').replace(/ /g, "_") : new Date().getTime() + '_' + file.originalname.replace('/', '-').replace(/ /g, "_");
      return cb(null, fileName);
    }
  })
};
