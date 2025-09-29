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

      if (req.user?.companyId) {
        companyId = req.user.companyId;
      } else {
        const authHeader = req.headers.authorization;
        const [, token] = authHeader.split(" ");
        const whatsapp = await Whatsapp.findOne({ where: { token } });
        companyId = whatsapp.companyId;
      }

      const companyFolder = `${publicFolder}/company${companyId}`;

      // Criar a pasta company{companyId} caso ela não exista
      if (!fs.existsSync(companyFolder)) {
        fs.mkdirSync(companyFolder, { recursive: true });
        fs.chmodSync(companyFolder, 0o777);
      }

      const folder = `${companyFolder}/quick/`;

      // Criar a pasta quick/ caso ela não exista
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
        fs.chmodSync(folder, 0o777);
      }

      return cb(null, folder);
    },
    filename(req, file, cb) {
      const fileName = `${new Date().getTime()}_${file.originalname.replace("/", "-")}`;
      return cb(null, fileName);
    }
  })
};