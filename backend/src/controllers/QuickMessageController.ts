import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import ListService from "../services/QuickMessageService/ListService";
import CreateService from "../services/QuickMessageService/CreateService";
import ShowService from "../services/QuickMessageService/ShowService";
import UpdateService from "../services/QuickMessageService/UpdateService";
import DeleteService from "../services/QuickMessageService/DeleteService";
import FindService from "../services/QuickMessageService/FindService";

import QuickMessage from "../models/QuickMessage";

import { head } from "lodash";
import fs from "fs";
import path from "path";

import AppError from "../errors/AppError";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  userId: string | number;
};

type StoreData = {
  shortcode: string;
  message: string;
  userId: number | number;
  geral: boolean;  
};

type FindParams = {
  companyId: string;
  userId: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
    const { companyId, id: userId } = req.user;

  const { records, count, hasMore } = await ListService({
    searchParam,
    pageNumber,
    companyId,
    userId
  });

  return res.json({ records, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const data = req.body as StoreData;

  const schema = Yup.object().shape({
    shortcode: Yup.string().required(),
    message: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const record = await CreateService({
    ...data,
    companyId,
    userId: req.user.id
  });

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-quickmessage`, {
    action: "create",
    record
  });

  return res.status(200).json(record);
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
  const { companyId } = req.user;

  const schema = Yup.object().shape({
    shortcode: Yup.string().required(),
    message: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { id } = req.params;

  const record = await UpdateService({
    ...data,
    userId: req.user.id,
    id,
  });

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-quickmessage`, {
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
  io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-quickmessage`, {
    action: "delete",
    id
  });

  return res.status(200).json({ message: "Contact deleted" });
};

export const findList = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const params = req.query as FindParams;
  const records: QuickMessage[] = await FindService(params);

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
    const quickmessage = await QuickMessage.findByPk(id);
    
    quickmessage.update ({
      mediaPath: file.filename,
      mediaName: file.originalname
    });

    return res.send({ mensagem: "Arquivo Anexado" });
    } catch (err: any) {
      throw new AppError(err.message);
  }
};

export const deleteMedia = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const { companyId } = req.user

  try {
    // Encontre a mensagem rápida
    const quickmessage = await QuickMessage.findByPk(id);

    // Verifique se a mensagem foi encontrada
    if (!quickmessage) {
      throw new AppError("Arquivo não encontrado", 404);
    }

    // Aplique a mesma lógica de renomeação para gerar o nome correto do arquivo
    let filename = quickmessage.mediaName;

    // Se o filename já tiver sido alterado (adicionando timestamp), remova esse prefixo
    const timestampRegex = /^\d+_/;
    if (timestampRegex.test(filename)) {
      // Remover o timestamp do começo do nome do arquivo
      filename = filename.replace(timestampRegex, '');
    }

    const filePath = path.resolve(
      "public",
      `company${companyId}`,
      "quick",
      filename
    );

    const fileExists = fs.existsSync(filePath);
    if (fileExists) {
      fs.unlinkSync(filePath); // Exclui o arquivo
    }

    // Atualiza os dados da mensagem no banco
    await quickmessage.update({
      mediaPath: null,
      mediaName: null
    });

    return res.send({ mensagem: "Arquivo Excluído" });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};