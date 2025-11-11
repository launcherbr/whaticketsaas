import { Op } from "sequelize";
import AppError from "../errors/AppError";
import Ticket from "../models/Ticket";

const CheckContactOpenTickets = async (contactId: number, whatsappId?: string, companyId?: number): Promise<Ticket | null> => {
  let ticket

  const whereClause: any = {
    contactId,
    status: { [Op.or]: ["open", "pending"] },
  };

  if (companyId) {
    whereClause.companyId = companyId;
  }

  if (whatsappId) {
    whereClause.whatsappId = whatsappId;
  }

  ticket = await Ticket.findOne({
    where: whereClause,
    include: [
      {
        association: "user",
        attributes: ["id", "name", "email"]
      }
    ]
  });

  return ticket;
};

export default CheckContactOpenTickets;
