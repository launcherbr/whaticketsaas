import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { head } from "lodash";
import fs from "fs";
import path from "path";

import ListService from "../services/AnnouncementService/ListService";
import CreateService from "../services/AnnouncementService/CreateService";
import ShowService from "../services/AnnouncementService/ShowService";
import UpdateService from "../services/AnnouncementService/UpdateService";
import DeleteService from "../services/AnnouncementService/DeleteService";
import FindService from "../services/AnnouncementService/FindService";

import Announcement from "../models/Announcement";
import User from "../models/User";

import AppError from "../errors/AppError";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  companyId: string | number;
  includeHidden?: string;
};

type StoreData = {
  priority: string;
  title: string;
  text: string;
  status: string;
  companyId: number;
  mediaPath?: string;
  mediaName?: string;
  showForSuperAdmin?: boolean;
  sendToAllCompanies?: boolean;
};

type FindParams = {
  companyId: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber, includeHidden } = req.query as IndexQuery;
  const { companyId } = req.user;
  
  // Verificar se é superadmin buscando o usuário
  let isSuperAdmin = false;
  try {
    const user = await User.findByPk(req.user.id, { attributes: ["id", "super"] });
    isSuperAdmin = user?.super || false;
  } catch (err) {
    // Se não conseguir buscar, assume false
    isSuperAdmin = false;
  }

  const { records, count, hasMore } = await ListService({
    searchParam,
    pageNumber,
    companyId,
    isSuperAdmin,
    includeHiddenForSuperAdmin: includeHidden === "true"
  });

  return res.json({ records, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const data = req.body as StoreData;

  const schema = Yup.object().shape({
    title: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { announcement, companiesCount } = await CreateService({
    ...data,
    companyId
  });

  const io = getIO();
  
  // Se foi enviado para todas empresas, emitir para todas
  if (data.sendToAllCompanies) {
    io.emit(`company-announcement`, {
      action: "create",
      record: announcement
    });
  } else {
    // Caso contrário, emitir apenas para a empresa
    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-announcement`, {
      action: "create",
      record: announcement
    });
  }

  return res.status(200).json({
    announcement,
    companiesCount
  });
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const record = await ShowService(id);

  return res.status(200).json(record);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const data = req.body as StoreData;

  const schema = Yup.object().shape({
    title: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { id } = req.params;

  const record = await UpdateService({
    ...data,
    id
  });

  const io = getIO();
  io.emit(`company-announcement`, {
    action: "update",
    record
  });

  return res.status(200).json(record);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const { companyId } = req.user;

  await DeleteService(id);

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-announcement`, {
    action: "delete",
    id
  });

  return res.status(200).json({ message: "Announcement deleted" });
};

export const findList = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const params = req.query as FindParams;
  const records: Announcement[] = await FindService(params);

  return res.status(200).json(records);
};

export const mediaUpload = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const files = req.files as Express.Multer.File[];
  const file = head(files);

  try {
    const announcement = await Announcement.findByPk(id);

    await announcement.update({
      mediaPath: file.filename,
      mediaName: file.originalname
    });
    await announcement.reload();

    const io = getIO();
    io.emit(`company-announcement`, {
      action: "update",
      record: announcement
    });

    return res.send({ mensagem: "Mensagem enviada" });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};

export const deleteMedia = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  try {
    const announcement = await Announcement.findByPk(id);
    const filePath = path.resolve("public", announcement.mediaPath);
    const fileExists = fs.existsSync(filePath);
    if (fileExists) {
      fs.unlinkSync(filePath);
    }

    await announcement.update({
      mediaPath: null,
      mediaName: null
    });
    await announcement.reload();

    const io = getIO();
    io.emit(`company-announcement`, {
      action: "update",
      record: announcement
    });

    return res.send({ mensagem: "Arquivo excluído" });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};
