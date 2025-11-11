import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";

const tokenAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Acesso não permitido", 401);
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    throw new AppError("Acesso não permitido", 401);
  }

  const whatsapp = await Whatsapp.findOne({ where: { token } });

  if (!whatsapp) {
    throw new AppError("Acesso não permitido", 401);
  }

  req.params = {
    ...req.params,
    whatsappId: whatsapp.id.toString()
  };

  return next();
};

export default tokenAuth;
