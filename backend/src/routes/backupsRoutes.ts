import express from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";
import * as BackupsController from "../controllers/BackupsController";

const backupsRoutes = express.Router();

// Todas as rotas requerem autenticação e ser superadmin
backupsRoutes.get("/backups", isAuth, isSuper, BackupsController.index);
backupsRoutes.post("/backups", isAuth, isSuper, BackupsController.store);
backupsRoutes.get("/backups/:backupId/download", isAuth, isSuper, BackupsController.download);
backupsRoutes.delete("/backups/:backupId", isAuth, isSuper, BackupsController.remove);

export default backupsRoutes;



