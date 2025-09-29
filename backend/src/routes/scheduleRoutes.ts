import { Router } from "express";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";
import multer from "multer";

import * as ScheduleController from "../controllers/ScheduleController";


const scheduleRoutes = Router();
const upload = multer(uploadConfig);

scheduleRoutes.get("/schedules", isAuth, ScheduleController.index);

scheduleRoutes.post("/schedules", isAuth, upload.array("file"), ScheduleController.store);

scheduleRoutes.put("/schedules/:scheduleId", isAuth, upload.array("file"), ScheduleController.update);

scheduleRoutes.get("/schedules/:scheduleId", isAuth, ScheduleController.show);

scheduleRoutes.delete("/schedules/:scheduleId", isAuth, ScheduleController.remove);

export default scheduleRoutes;
