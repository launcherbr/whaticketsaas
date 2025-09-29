import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { head } from "lodash";

import AppError from "../errors/AppError";

import CreateService from "../services/ScheduleServices/CreateService";
import ListService from "../services/ScheduleServices/ListService";
import UpdateService from "../services/ScheduleServices/UpdateService";
import ShowService from "../services/ScheduleServices/ShowService";
import DeleteService from "../services/ScheduleServices/DeleteService";
import Schedule from "../models/Schedule";

type IndexQuery = {
  searchParam?: string;
  contactId?: number | string;
  userId?: number | string;
  pageNumber?: string | number;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { contactId, userId, pageNumber, searchParam } = req.query as IndexQuery;
  const { companyId } = req.user;

  const { schedules, count, hasMore } = await ListService({
    searchParam,
    contactId,
    userId,
    pageNumber,
    companyId
  });

  return res.json({ schedules, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {

  const recebeScheduleData = req?.body
  const formatInfo= JSON.parse(recebeScheduleData?.scheduleData)
  const files = req?.files as Express.Multer.File[];
  const file = head(files);

  const {
    body,
    sendAt,
    contactId,
    userId,
    geral,
    queueId,
    whatsappId,
    repeatEvery,
    selectDaysRecorrenci,
    repeatCount,
  } = formatInfo;
  const { companyId } = req.user;

  //console.log(req.body);


  const schedule = await CreateService({
    body,
    sendAt,
    contactId,
    companyId,
    userId,
    geral,
    queueId,
    whatsappId,
    mediaPath: file?.filename ,
    mediaName: file?.originalname,
    repeatEvery,
    selectDaysRecorrenci,
    repeatCount,
  });

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-schedule`, {
    action: "create",
    schedule
  });

  return res.status(200).json(schedule);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { scheduleId } = req.params;
  const { companyId } = req.user;

  const schedule = await ShowService(scheduleId, companyId);

  return res.status(200).json(schedule);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const { scheduleId } = req.params;
  const recebeScheduleData = req?.body;
  const scheduleData = JSON.parse(recebeScheduleData?.scheduleData)
  const files = req?.files as Express.Multer.File[];
  const file = head(files);
  const { companyId } = req.user;

  const importAnexoSchedule = await Schedule.findByPk(scheduleId);

  await importAnexoSchedule.update({
    mediaPath: file?.filename,
    mediaName: file?.originalname
  });
  await importAnexoSchedule.reload();

  const schedule = await UpdateService({ scheduleData, id: scheduleId, companyId,  mediaPath:file?.filename, mediaName:file?.originalname });

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-schedule`, {
    action: "update",
    schedule
  });

  return res.status(200).json(schedule);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { scheduleId } = req.params;
  const { companyId } = req.user;

  await DeleteService(scheduleId, companyId);

  const io = getIO();
 io.emit("schedule", {
    action: "delete",
    scheduleId
  });

  return res.status(200).json({ message: "Schedule deleted" });
};
