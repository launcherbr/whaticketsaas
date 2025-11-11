import fs from "fs";
import path from "path";
import multer from "multer";

const certsFolder = path.resolve(__dirname, "..", "..", "certs");

if (!fs.existsSync(certsFolder)) {
  fs.mkdirSync(certsFolder, { recursive: true });
}

export default {
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, certsFolder);
    },
    filename: (_req, _file, cb) => {
      const superAdminCompanyId = Number(process.env.SUPER_ADMIN_COMPANY_ID || 1);
      const filename = `gerencianet_${superAdminCompanyId}.p12`;
      cb(null, filename);
    }
  }),
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".p12")) {
      return cb(new Error("Certificado deve estar no formato .p12"));
    }

    cb(null, true);
  }
};

