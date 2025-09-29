import { Router } from "express";
import isAuth from "../middleware/isAuth";

import * as SettingController from "../controllers/SettingController";
import multer from "multer";
import uploadConfig from "../config/uploadlogo";
const upload = multer(uploadConfig);

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

export default settingRoutes;
