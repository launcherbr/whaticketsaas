import express from "express";
import isAuth from "../middleware/isAuth";
import * as ForgotController from "../controllers/ForgotController";
const forgotsRoutes = express.Router();
forgotsRoutes.post("/forgetpassword/:email", ForgotController.store);
forgotsRoutes.post(
  "/resetpasswords/:email/:token/:password",
  ForgotController.resetPasswords
);
export default forgotsRoutes;
