import path from "path";
import multer from "multer";
import fs from "fs";
import Whatsapp from "../models/Whatsapp";
import { isEmpty, isNil } from "lodash";

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
        const [, token] = authHeader.split(" ");
        const whatsapp = await Whatsapp.findOne({ where: { token } });
        companyId = whatsapp.companyId;
      }
      let folder;

      if (typeArch && typeArch !== "announcements" && typeArch !== "logo") {
        folder = path.resolve(publicFolder, `company${companyId}`, typeArch, fileId ? fileId : "")
      } else if (typeArch && typeArch === "announcements") {
        folder = path.resolve(publicFolder, typeArch)
      } else if (typeArch === "logo") {
        folder = path.resolve(publicFolder)
      }
      else {
        folder = path.resolve(publicFolder, `company${companyId}`)
      }

      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true })
        fs.chmodSync(folder, 0o777)
      }
      return cb(null, folder);
    },
    filename(req, file, cb) {
      const { typeArch } = req.body;

      const fileName = typeArch && typeArch !== "announcements" ? file.originalname.replace('/', '-').replace(/ /g, "_") : new Date().getTime() + '_' + file.originalname.replace('/', '-').replace(/ /g, "_");
      return cb(null, fileName);
    }
  })
};
