import express from "express";
import isAuth from "../middleware/isAuth";
import multer from "multer";
import uploadConfig from "../config/upload";

const upload = multer(uploadConfig);

import * as WhatsAppController from "../controllers/WhatsAppController";
import * as HolidayPeriodController from "../controllers/HolidayPeriodController";

const whatsappRoutes = express.Router();

whatsappRoutes.get("/whatsapp/", isAuth, WhatsAppController.index);

whatsappRoutes.post("/whatsapp/", isAuth, WhatsAppController.store);

whatsappRoutes.get("/whatsapp/:whatsappId", isAuth, WhatsAppController.show);

whatsappRoutes.put("/whatsapp/:whatsappId", isAuth, WhatsAppController.update);

whatsappRoutes.post("/whatsapp-restart/", isAuth, WhatsAppController.restart);

whatsappRoutes.delete(
  "/whatsapp/:whatsappId",
  isAuth,
  WhatsAppController.remove
);

whatsappRoutes.post(
  "/whatsapp/:whatsappId/greeting-media",
  isAuth,
  upload.single("file"),
  WhatsAppController.greetingMediaUpload
);

whatsappRoutes.delete(
  "/whatsapp/:whatsappId/greeting-media",
  isAuth,
  WhatsAppController.deleteGreetingMedia
);

// Holiday Periods routes
whatsappRoutes.get(
  "/whatsapp/:whatsappId/holiday-periods",
  isAuth,
  HolidayPeriodController.index
);

whatsappRoutes.post(
  "/whatsapp/:whatsappId/holiday-periods",
  isAuth,
  HolidayPeriodController.store
);

whatsappRoutes.put(
  "/whatsapp/:whatsappId/holiday-periods/:id",
  isAuth,
  HolidayPeriodController.update
);

whatsappRoutes.delete(
  "/whatsapp/:whatsappId/holiday-periods/:id",
  isAuth,
  HolidayPeriodController.remove
);

export default whatsappRoutes;
