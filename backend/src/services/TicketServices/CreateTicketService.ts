import AppError from "../../errors/AppError";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import ShowContactService from "../ContactServices/ShowContactService";
import { getIO } from "../../libs/socket";
import GetDefaultWhatsAppByUser from "../../helpers/GetDefaultWhatsAppByUser";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";

interface Request {
  contactId: number;
  status: string;
  userId: number;
  companyId: number;
  queueId?: number;
  whatsappId?: string;
}

const CreateTicketService = async ({
  contactId,
  status,
  userId,
  queueId,
  companyId,
  whatsappId
}: Request): Promise<Ticket> => {
  let whatsapp;

  if (whatsappId !== undefined && whatsappId !== null && whatsappId !==  "") {
    whatsapp = await ShowWhatsAppService(whatsappId, companyId)
  }
  
  let defaultWhatsapp = await GetDefaultWhatsAppByUser(userId);

  if (whatsapp) {
    defaultWhatsapp = whatsapp;
  }
  if (!defaultWhatsapp)
    defaultWhatsapp = await GetDefaultWhatsApp(companyId);

  const existingTicket = await CheckContactOpenTickets(contactId, whatsappId, companyId);
  
  if (existingTicket) {
    // Obter informações do usuário que está atendendo (já incluído na busca)
    let userName = "Nenhum atendente";
    if (existingTicket.user && existingTicket.user.name) {
      userName = existingTicket.user.name;
    } else if (existingTicket.userId) {
      // Se não veio no include, buscar separadamente
      const User = (await import("../../models/User")).default;
      const attendingUser = await User.findByPk(existingTicket.userId, {
        attributes: ["id", "name", "email"]
      });
      if (attendingUser) {
        userName = attendingUser.name;
      }
    }
    throw new AppError(`TICKET_ALREADY_OPEN|${userName}|${existingTicket.userId || ""}`, 409);
  }

  const { isGroup } = await ShowContactService(contactId, companyId);

  const [{ id }] = await Ticket.findOrCreate({
    where: {
      contactId,
      companyId,
      whatsappId
    },
    defaults: {
      contactId,
      companyId,
      whatsappId: defaultWhatsapp.id,
      status,
      isGroup,
      userId
    }
  });

  await Ticket.update(
    { companyId, queueId, userId, whatsappId: defaultWhatsapp.id, status: "open" },
    { where: { id } }
  );

  const ticket = await Ticket.findByPk(id, { include: ["contact", "queue"] });

  if (!ticket) {
    throw new AppError("ERR_CREATING_TICKET");
  }

  const io = getIO();

  io.to(ticket.id.toString()).emit("ticket", {
    action: "update",
    ticket
  });

  return ticket;
};

export default CreateTicketService;
