import { Request, Response } from "express";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import { getWhatsAppSenderByWhatsappId } from "../helpers/GetWhatsAppSender";

const store = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  const whatsapp = await ShowWhatsAppService(whatsappId, companyId);
  await StartWhatsAppSession(whatsapp, companyId);

  return res.status(200).json({ message: "Starting session." });
};

const update = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  const whatsapp = await ShowWhatsAppService(whatsappId, companyId);

  await whatsapp.update({ session: "" });

  await StartWhatsAppSession(whatsapp, companyId);

  return res.status(200).json({ message: "Starting session." });
};

const remove = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;
  const whatsapp = await ShowWhatsAppService(whatsappId, companyId);

  if (whatsapp.session || whatsapp.status === "CONNECTED") {
    await whatsapp.update({ status: "DISCONNECTED", session: "" });
    try {
      const sender = await getWhatsAppSenderByWhatsappId(whatsapp.id);
      if (sender.logout) await sender.logout();
    } catch (_e) {
      // Session pode não existir em memória (ex.: reinício do servidor)
    }
  }

  return res.status(200).json({ message: "Session disconnected." });
};

export default { store, remove, update };
