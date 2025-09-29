import { Request, Response } from 'express';
import DashboardDataService, {
  DashboardData,
  Params,
} from '../services/ReportService/DashbardDataService';
import { TicketsAttendance } from '../services/ReportService/TicketsAttendance';
import { TicketsDayService } from '../services/ReportService/TicketsDayService';

type IndexQuery = {
  initialDate: string;
  finalDate: string;
  companyId: number | any;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const params: Params = req.query;
  const { companyId } = req.user;
  let daysInterval = 3;

  const dashboardData: DashboardData = await DashboardDataService(
    companyId,
    params,
  );
  return res.status(200).json(dashboardData);
};

export const reportsUsers = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { initialDate, finalDate, companyId } = req.query as IndexQuery;

  const { data } = await TicketsAttendance({
    initialDate,
    finalDate,
    companyId,
  });

  return res.json({ data });
};

export const reportsDay = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { initialDate, finalDate, companyId } = req.query as IndexQuery;

  const { count, data } = await TicketsDayService({
    initialDate,
    finalDate,
    companyId,
  });

  return res.json({ count, data });
};
