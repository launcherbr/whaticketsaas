import moment from "moment";
import * as Sentry from "@sentry/node";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import Queue from "../../models/Queue";
import ShowTicketService from "./ShowTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { verifyMessage } from "../WbotServices/wbotMessageListener";
import ListSettingsServiceOne from "../SettingServices/ListSettingsServiceOne"; //NOVO PLW DESIGN//
import ShowUserService from "../UserServices/ShowUserService"; //NOVO PLW DESIGN//
import { isNil } from "lodash";
import Whatsapp from "../../models/Whatsapp";
import User from "../../models/User";
import { Op, QueryTypes } from "sequelize";
import AppError from "../../errors/AppError";
import { buildContactAddress } from "../../utils/global";
import formatBody from "../../helpers/Mustache";


interface TicketData {
  status?: string;
  userId?: number | null;
  queueId?: number | null;
  chatbot?: boolean;
  queueOptionId?: number;
  whatsappId?: string;
  useIntegration?: boolean;
  integrationId?: number | null;
  promptId?: number | null;
  lastMessage?: string;
}

interface Request {
  ticketData: TicketData;
  ticketId: string | number;
  companyId: number;
}

interface Response {
  ticket: Ticket;
  oldStatus: string;
  oldUserId: number | undefined;
}

const UpdateTicketService = async ({
  ticketData,
  ticketId,
  companyId
}: Request): Promise<Response> => {

  try {
    let { status } = ticketData;
    let { queueId, userId, whatsappId, lastMessage = null } = ticketData;
    let chatbot: boolean | null = ticketData.chatbot || false;
    let queueOptionId: number | null = ticketData.queueOptionId || null;
    let promptId: number | null = ticketData.promptId || null;
    let useIntegration: boolean | null = ticketData.useIntegration || false;
    let integrationId: number | null = ticketData.integrationId || null;

    console.log("ticketData", ticketData);

    const io = getIO();

    const ticket = await ShowTicketService(ticketId, companyId);
    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId,
      companyId,
      whatsappId: ticket.whatsappId
    });

    if (isNil(whatsappId)) {
      whatsappId = ticket.whatsappId?.toString();
    }

    await SetTicketMessagesAsRead(ticket);

    const oldStatus = ticket.status;
    const oldUserId = ticket.user?.id;
    const oldQueueId = ticket.queueId;

    // Verificar se o ticket já está aberto por outro usuário
    if (status === "open" && userId && oldStatus === "open" && oldUserId && oldUserId !== userId) {
      // Buscar informações do usuário que está atendendo
      const currentUser = await User.findByPk(oldUserId, {
        attributes: ["id", "name", "email"]
      });
      
      throw new AppError(
        `TICKET_ALREADY_OPEN|${currentUser?.name || "Atendente"}|${oldUserId}`,
        409
      );
    }

    if (oldStatus === "closed" || Number(whatsappId) !== ticket.whatsappId) {
      // let otherTicket = await Ticket.findOne({
      //   where: {
      //     contactId: ticket.contactId,
      //     status: { [Op.or]: ["open", "pending", "group"] },
      //     whatsappId
      //   }
      // });
      // if (otherTicket) {
      //     otherTicket = await ShowTicketService(otherTicket.id, companyId)

      //     await ticket.update({status: "closed"})

      //     io.to(oldStatus).emit(`company-${companyId}-ticket`, {
      //       action: "delete",
      //       ticketId: ticket.id
      //     });

      //     return { ticket: otherTicket, oldStatus, oldUserId }
      // }
      await CheckContactOpenTickets(ticket.contact.id, whatsappId);
      chatbot = null;
      queueOptionId = null;
    }

    if (status === "closed") {
      const { complationMessage, ratingMessage } = ticket.whatsappId
        ? await ShowWhatsAppService(ticket.whatsappId, companyId)
        : { complationMessage: null, ratingMessage: null };

      const settingEvaluation = await ListSettingsServiceOne({
        companyId: companyId,
        key: "userRating"
      });

  // Envia a mensagem de avaliação apenas se o ticket não estiver em status 'pendente'
  if (
    ticket.status !== "pending" &&  // Adiciona a verificação para evitar avaliação em status pendente
    !ticket.isGroup &&
    !ticket.contact.isGroup &&
    !ticket.contact.disableBot &&
    settingEvaluation?.value === "enabled"
  ) {
    if (ticketTraking.ratingAt == null && ticketTraking.userId !== null) {
      const bodyRatingMessage = `${
        ratingMessage ? ratingMessage + "\n\n" : ""
      }Digite de 1 a 5 para qualificar nosso atendimento:\n\n*1* - 😞 _Péssimo_\n*2* - 😕 _Ruim_\n*3* - 😐 _Neutro_\n*4* - 🙂 _Bom_\n*5* - 😊 _Ótimo_`;

      await SendWhatsAppMessage({ body: bodyRatingMessage, ticket });

      await ticketTraking.update({
        ratingAt: moment().toDate()
      });

      // Remove o ticket da lista de abertos
      io.to(`company-${ticket.companyId}-open`)
        .to(`queue-${ticket.queueId}-open`)
        .to(ticketId.toString())
        .emit(`company-${ticket.companyId}-ticket`, {
          action: "delete",
          ticketId: ticket.id
        });

      return { ticket, oldStatus, oldUserId };
    }

    ticketTraking.ratingAt = moment().toDate();
    ticketTraking.rated = false;
  } else {
    // Envia apenas a mensagem de finalização se estiver configurada
    ticketTraking.finishedAt = moment().toDate();

    if (
      !ticket.isGroup &&
      !ticket.contact.isGroup &&
      !ticket.contact.disableBot &&
      !isNil(complationMessage) &&
      complationMessage !== ""
    ) {
      const body = `\u200e${complationMessage}`;
      await SendWhatsAppMessage({ body, ticket });
    }
  }

  await ticket.update({
    promptId: null,
    integrationId: null,
    useIntegration: false,
    typebotStatus: false,
    typebotSessionId: null
  });

  ticketTraking.finishedAt = moment().toDate();
  ticketTraking.whatsappId = ticket.whatsappId;
  ticketTraking.userId = ticket.userId;

}

    if (queueId !== undefined && queueId !== null) {
      ticketTraking.queuedAt = moment().toDate();
    }

    const settingsTransfTicket = await ListSettingsServiceOne({ companyId: companyId, key: "sendMsgTransfTicket" });
    const settingsTransfTicketMessage = await ListSettingsServiceOne({ companyId: companyId, key: "sendMsgTransfTicketMessage" });
    const transferTemplateDefault = "{{ms}} {{name}}, seu atendimento foi transferido. Departamento: {{queue}}. Atendente: {{agent}}.";
    const transferTemplate = settingsTransfTicketMessage?.value?.trim() || transferTemplateDefault;

    const settingsGreetingAccepted = await ListSettingsServiceOne({ companyId: companyId, key: "sendGreetingAccepted" });
    const settingsGreetingAcceptedMessage = await ListSettingsServiceOne({ companyId: companyId, key: "sendGreetingAcceptedMessage" });
    const greetingTemplateDefault = "{{ms}} {{name}}, meu nome é {{agent}} e vou prosseguir com seu atendimento!";
    const greetingTemplate = settingsGreetingAcceptedMessage?.value?.trim() || greetingTemplateDefault;

    const hasQueueTransfer =
      !isNil(oldQueueId) && !isNil(queueId) && oldQueueId !== queueId;
    const hasAgentTransfer =
      !isNil(oldUserId) && !isNil(userId) && oldUserId !== userId;

    if (
      settingsTransfTicket?.value === "enabled" &&
      transferTemplate &&
      (hasQueueTransfer || hasAgentTransfer) &&
      !ticket.isGroup &&
      !ticket.contact.isGroup
    ) {
      const queue = !isNil(queueId) ? await Queue.findByPk(queueId) : null;
      const oldQueue = !isNil(oldQueueId) ? await Queue.findByPk(oldQueueId) : null;
      const newAgent = !isNil(userId) ? await ShowUserService(userId) : null;
      const previousAgent = !isNil(oldUserId) ? await ShowUserService(oldUserId) : null;

      const messageBody = formatBody(transferTemplate, ticket.contact, {
        queue: queue?.name || "",
        agent: newAgent?.name || "",
        previousAgent: previousAgent?.name || "",
        previousQueue: oldQueue?.name || ""
      });

      if (messageBody.trim()) {
        const wbot = await GetTicketWbot(ticket);
        const queueChangedMessage = await wbot.sendMessage(
          buildContactAddress(ticket.contact, ticket.isGroup),
          {
            text: messageBody
          }
        );
        await verifyMessage(queueChangedMessage, ticket, ticket.contact);
      }
    }

    await ticket.update({
      status,
      queueId,
      userId,
      whatsappId,
      chatbot,
      queueOptionId,
      lastMessage: lastMessage !== null ? lastMessage : ticket.lastMessage
    });

    await ticket.reload();

    if (status === "pending") {
      await ticketTraking.update({
        whatsappId,
        queuedAt: moment().toDate(),
        startedAt: null,
        userId: null
      });
    }

    if (status === "open") {
      await ticketTraking.update({
        startedAt: moment().toDate(),
        ratingAt: null,
        rated: false,
        whatsappId,
        userId: ticket.userId
      });

      if (
        settingsGreetingAccepted?.value === "enabled" &&
        greetingTemplate &&
        !ticket.isGroup &&
        !ticket.contact.isGroup &&
        ticket.contact.disableBot !== true &&
        oldStatus !== "open"
      ) {
        const queue = ticket.queueId ? await Queue.findByPk(ticket.queueId) : null;
        const newAgent = ticket.userId ? await ShowUserService(ticket.userId) : null;
        const greetingBody = formatBody(greetingTemplate, ticket.contact, {
          queue: queue?.name || "",
          agent: newAgent?.name || ""
        });

        if (greetingBody.trim()) {
          const wbot = await GetTicketWbot(ticket);
          const sentMessage = await wbot.sendMessage(
            buildContactAddress(ticket.contact, ticket.isGroup),
            {
              text: greetingBody
            }
          );
          await verifyMessage(sentMessage, ticket, ticket.contact);
        }
      }
    }

    await ticketTraking.save();

    if (ticket.status !== oldStatus || ticket.user?.id !== oldUserId) {

      io.to(`company-${companyId}-${oldStatus}`)
        .to(`queue-${ticket.queueId}-${oldStatus}`)
        .to(`user-${oldUserId}`)
        .emit(`company-${companyId}-ticket`, {
          action: "delete",
          ticketId: ticket.id
        });
    }

    io.to(`company-${companyId}-${ticket.status}`)
      .to(`company-${companyId}-notification`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-notification`)
      .to(ticketId.toString())
      .to(`user-${ticket?.userId}`)
      .to(`user-${oldUserId}`)
      .emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket
      });

    return { ticket, oldStatus, oldUserId };
  } catch (err) {
    Sentry.captureException(err);
  }
};

export default UpdateTicketService;
