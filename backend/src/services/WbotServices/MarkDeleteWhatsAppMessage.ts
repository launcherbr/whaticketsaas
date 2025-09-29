import Message from "../../models/Message";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import UpdateTicketService from "../TicketServices/UpdateTicketService";

const MarkDeleteWhatsAppMessage = async (from: any, timestamp?: any, msgId?: string, companyId?: number): Promise<Message> => {

  from = from.replace('@c.us', '').replace('@s.whatsapp.net', '')

  if (msgId) {

    const messages = await Message.findAll({
      where: {
        id: msgId,
        companyId
      }
    });

    try {
      const messageToUpdate = await Message.findByPk(
        messages[0].id, {
        include: [
          "contact",
          {
            model: Message,
            as: "quotedMsg",
            include: ["contact"]
          }
        ]
      });

      if (messageToUpdate) {
        const ticket = await Ticket.findOne({
          where: {
            id: messageToUpdate.ticketId,
            companyId
          }
        })


        await messageToUpdate.update({ isDeleted: true });



        await UpdateTicketService({ ticketData: { lastMessage: "🚫 _Mensagem Apagada_" }, ticketId: ticket.id, companyId })

        const io = getIO();
        io.of(companyId.toString())
          // .to(messageToUpdate.ticketId.toString())
          .emit(`appMessage-${messageToUpdate}`, {
            action: "update",
            message: messageToUpdate
          });
      }
    } catch (err) {
      console.log("Erro ao tentar marcar a mensagem com excluída")
    }

    return timestamp;
  };

}

export default MarkDeleteWhatsAppMessage;
