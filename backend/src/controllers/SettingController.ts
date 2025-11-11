import { Request, Response } from "express";
import authConfig from "../config/auth";
import * as Yup from "yup";

import { getIO } from "../libs/socket";
import AppError from "../errors/AppError";

import { head } from "lodash";
import fs from "fs";
import path from "path";
import User from "../models/User";
import Company from "../models/Company";

import UpdateSettingService from "../services/SettingServices/UpdateSettingService";
import ListSettingsService from "../services/SettingServices/ListSettingsService";
import ShowSettingsService from "../services/SettingServices/ShowSettingsService";

const SUPER_ADMIN_COMPANY_ID = Number(process.env.SUPER_ADMIN_COMPANY_ID || 1);

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;

  //if (req.user.profile !== "admin") {
    //throw new AppError("ERR_NO_PERMISSION", 403);
  //}

  const settings = await ListSettingsService({ companyId });

  return res.status(200).json(settings);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  const { settingKey: key } = req.params;
  const { value } = req.body;
  const { companyId } = req.user;

  const setting = await UpdateSettingService({
    key,
    value,
    companyId
  });

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-settings`, {
    action: "update",
    setting
  });

  return res.status(200).json(setting);
};


export const show = async (
  req: Request,
  res: Response
): Promise<Response> => {

  //const { companyId } = req.user;
  const companyId = SUPER_ADMIN_COMPANY_ID;
  const { settingKey } = req.params;
  

  const retornoData = await ShowSettingsService({ settingKey, companyId });

  return res.status(200).json(retornoData);
};


export const mediaUpload = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { body } = req.body;
  const { companyId } = req.user;

  const userId = req.user.id;
  const requestUser = await User.findByPk(userId);

  if (requestUser.super === false) {
    throw new AppError("você nao tem permissão para esta ação!");
  }

  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (companyId !== SUPER_ADMIN_COMPANY_ID) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const files = req.files as Express.Multer.File[];
  const file = head(files);
  console.log(file);
  return res.send({ mensagem: "Arquivo Anexado" });
};


export const gerencianetCertUpload = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId, profile, id: userId } = req.user;

  const requestUser = await User.findByPk(userId);

  if (!requestUser?.super) {
    throw new AppError("você nao tem permissão para esta ação!");
  }

  if (profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (companyId !== SUPER_ADMIN_COMPANY_ID) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    throw new AppError("Nenhum certificado foi enviado.", 400);
  }

  const certKey = path.parse(file.filename).name;

  const setting = await UpdateSettingService({
    key: "gerencianetPixCert",
    value: certKey,
    companyId: SUPER_ADMIN_COMPANY_ID
  });

  return res.status(200).json({
    filename: file.filename,
    setting
  });
};



export const docUpload = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { body } = req.body;
  const { companyId } = req.user;

  const userId = req.user.id;
  const requestUser = await User.findByPk(userId);

  if (requestUser.super === false) {
    throw new AppError("você nao tem permissão para esta ação!");
  }

  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (companyId !== SUPER_ADMIN_COMPANY_ID) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const files = req.files as Express.Multer.File[];
  const file = head(files);
  console.log(file);
  return res.send({ mensagem: "Arquivo Anexado" });
};
