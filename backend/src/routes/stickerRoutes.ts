import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";

import * as StickerController from "../controllers/StickerController";

const stickerRoutes = Router();

const upload = multer(uploadConfig);

stickerRoutes.get("/stickers", isAuth, StickerController.index);
stickerRoutes.post("/stickers", isAuth, (req, res, next) => {
  // Adicionar typeArch ao body para que o upload saiba onde salvar
  req.body.typeArch = "stickers";
  next();
}, upload.single("sticker"), StickerController.store);
stickerRoutes.delete("/stickers/:stickerId", isAuth, StickerController.remove);

export default stickerRoutes;
