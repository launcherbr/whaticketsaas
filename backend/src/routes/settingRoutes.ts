import { Router } from "express";
import isAuth from "../middleware/isAuth";

import * as SettingController from "../controllers/SettingController";
import multer from "multer";
import uploadConfig from "../config/uploadlogo";
import uploadGerencianetCertConfig from "../config/uploadGerencianetCert";
const upload = multer(uploadConfig);
const uploadGerencianetCert = multer(uploadGerencianetCertConfig);

const settingRoutes = Router();

settingRoutes.get("/settings", isAuth, SettingController.index);

settingRoutes.get("/settings/:settingKey", SettingController.show);

settingRoutes.put("/settings/:settingKey", isAuth, SettingController.update);

settingRoutes.post(
  "/settings/media-upload",
  isAuth,
  upload.array("file"),
  SettingController.mediaUpload
);

settingRoutes.post(
  "/settings/gerencianet-cert-upload",
  isAuth,
  uploadGerencianetCert.single("file"),
  SettingController.gerencianetCertUpload
);

export default settingRoutes;
