import { Request, Response } from "express";
import BirthdayReminderService from "../services/BirthdayReminderService";
import { logger } from "../utils/logger";

export const testBirthdayReminder = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    logger.info("Executando teste manual do serviço de aniversários");
    await BirthdayReminderService();
    return res.status(200).json({ 
      message: "Serviço de aniversários executado com sucesso. Verifique os logs para mais detalhes." 
    });
  } catch (err) {
    logger.error(`Erro ao executar serviço de aniversários: ${err}`);
    return res.status(500).json({ 
      error: "Erro ao executar serviço de aniversários",
      details: err instanceof Error ? err.message : String(err)
    });
  }
};


