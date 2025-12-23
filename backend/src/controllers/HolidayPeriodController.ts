import { Request, Response } from "express";
import HolidayPeriod from "../models/HolidayPeriod";
import { logger } from "../utils/logger";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  try {
    const holidayPeriods = await HolidayPeriod.findAll({
      where: {
        whatsappId: parseInt(whatsappId),
        companyId,
      },
      order: [["startDate", "ASC"]],
    });

    // Garante que as datas são retornadas como string YYYY-MM-DD
    const formattedPeriods = holidayPeriods.map(period => {
      const periodData: any = period.toJSON();
      // Extrai as datas usando getDataValue para garantir formato correto
      const startDateValue = period.getDataValue('startDate');
      const endDateValue = period.getDataValue('endDate');
      
      // Converte para string YYYY-MM-DD se necessário
      if (startDateValue instanceof Date) {
        const year = startDateValue.getUTCFullYear();
        const month = String(startDateValue.getUTCMonth() + 1).padStart(2, '0');
        const day = String(startDateValue.getUTCDate()).padStart(2, '0');
        periodData.startDate = `${year}-${month}-${day}`;
      } else if (typeof startDateValue === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(startDateValue)) {
        // Se não está no formato correto, tenta converter
        const date = new Date(startDateValue);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        periodData.startDate = `${year}-${month}-${day}`;
      }
      
      if (endDateValue instanceof Date) {
        const year = endDateValue.getUTCFullYear();
        const month = String(endDateValue.getUTCMonth() + 1).padStart(2, '0');
        const day = String(endDateValue.getUTCDate()).padStart(2, '0');
        periodData.endDate = `${year}-${month}-${day}`;
      } else if (typeof endDateValue === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(endDateValue)) {
        // Se não está no formato correto, tenta converter
        const date = new Date(endDateValue);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        periodData.endDate = `${year}-${month}-${day}`;
      }
      
      return periodData;
    });

    return res.status(200).json(formattedPeriods);
  } catch (error) {
    logger.error(`Error listing holiday periods: ${error}`);
    return res.status(500).json({ error: "Failed to list holiday periods" });
  }
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;
  const { startDate, endDate, message, active, repeatIntervalHours } = req.body;

  try {
    // Garante que as datas são salvas corretamente como string YYYY-MM-DD
    // DATEONLY do Sequelize aceita string diretamente, evitando problemas de timezone
    let startDateStr = String(startDate);
    let endDateStr = String(endDate);
    
    // Remove qualquer parte de hora se existir
    if (startDateStr.includes('T')) {
      startDateStr = startDateStr.split('T')[0];
    }
    if (endDateStr.includes('T')) {
      endDateStr = endDateStr.split('T')[0];
    }
    
    // Garante formato YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateStr)) {
      throw new Error("Formato de data de início inválido. Use YYYY-MM-DD");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endDateStr)) {
      throw new Error("Formato de data de término inválido. Use YYYY-MM-DD");
    }

    const holidayPeriod = await HolidayPeriod.create({
      whatsappId: parseInt(whatsappId),
      companyId,
      startDate: startDateStr,
      endDate: endDateStr,
      message,
      active: active !== undefined ? active : true,
      repeatIntervalHours: repeatIntervalHours || 24,
    });

    return res.status(200).json(holidayPeriod);
  } catch (error) {
    logger.error(`Error creating holiday period: ${error}`);
    return res.status(500).json({ error: "Failed to create holiday period" });
  }
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { companyId } = req.user;
  const { startDate, endDate, message, active, repeatIntervalHours } = req.body;

  try {
    const holidayPeriod = await HolidayPeriod.findOne({
      where: {
        id: parseInt(id),
        companyId,
      },
    });

    if (!holidayPeriod) {
      return res.status(404).json({ error: "Holiday period not found" });
    }

    // Garante que as datas são salvas corretamente como string YYYY-MM-DD
    const updateData: any = {
      message,
      active,
      repeatIntervalHours: repeatIntervalHours !== undefined ? repeatIntervalHours : holidayPeriod.repeatIntervalHours,
    };

    if (startDate) {
      let startDateStr = String(startDate);
      if (startDateStr.includes('T')) {
        startDateStr = startDateStr.split('T')[0];
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateStr)) {
        throw new Error("Formato de data de início inválido. Use YYYY-MM-DD");
      }
      updateData.startDate = startDateStr;
    }
    if (endDate) {
      let endDateStr = String(endDate);
      if (endDateStr.includes('T')) {
        endDateStr = endDateStr.split('T')[0];
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(endDateStr)) {
        throw new Error("Formato de data de término inválido. Use YYYY-MM-DD");
      }
      updateData.endDate = endDateStr;
    }

    await holidayPeriod.update(updateData);

    return res.status(200).json(holidayPeriod);
  } catch (error) {
    logger.error(`Error updating holiday period: ${error}`);
    return res.status(500).json({ error: "Failed to update holiday period" });
  }
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { companyId } = req.user;

  try {
    const holidayPeriod = await HolidayPeriod.findOne({
      where: {
        id: parseInt(id),
        companyId,
      },
    });

    if (!holidayPeriod) {
      return res.status(404).json({ error: "Holiday period not found" });
    }

    await holidayPeriod.destroy();

    return res.status(200).json({ message: "Holiday period deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting holiday period: ${error}`);
    return res.status(500).json({ error: "Failed to delete holiday period" });
  }
};

