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
import ListSettingsServiceOne from "../SettingServices/ListSettingsServiceOne"; //NOVO//
import ShowUserService from "../UserServices/ShowUserService"; //NOVO//
import { isNil } from "lodash";
import Whatsapp from "../../models/Whatsapp";
import User from "../../models/User";
import { Op, QueryTypes } from "sequelize";
import AppError from "../../errors/AppError";
import { buildContactAddress } from "../../utils/global";
import formatBody from "../../helpers/Mustache";
import TicketUser from "../../models/TicketUser";


interface TicketData {
  status?: string;
  userId?: number | null;
  userIds?: number[];
  ticketUsers?: Array<{ userId: number; queueId?: number | null }>;
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
    let { queueId, userId, userIds, ticketUsers, whatsappId, lastMessage = null } = ticketData;
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
      // Verificar se a fila tem linkToGroup ativo
      let queueLinkToGroup = false;
      if (ticket.queueId) {
        const queue = await Queue.findByPk(ticket.queueId);
        queueLinkToGroup = queue?.linkToGroup || false;
      }

      // Se for ticket de grupo com linkToGroup ativo, não executar automações
      const shouldDisableAutomations = ticket.isGroup && queueLinkToGroup;

      if (!shouldDisableAutomations) {
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
            const sentMessage = await SendWhatsAppMessage({ body, ticket });
            await verifyMessage(sentMessage, ticket, ticket.contact);
          }
        }
      } else {
        // Para tickets de grupo com linkToGroup, apenas atualizar o status sem automações
        ticketTraking.finishedAt = moment().toDate();
      }
    }

    await ticket.update({
      promptId: null,
      integrationId: null,
      useIntegration: false,
      typebotStatus: false,
      typebotSessionId: null
    });

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

    // Gerenciar múltiplos usuários se ticketUsers ou userIds for fornecido
    let hasTicketUsersChanged = false;
    if (ticketUsers !== undefined && Array.isArray(ticketUsers)) {
      // Verificar se houve mudança nos usuários
      const currentTicketUsers = await TicketUser.findAll({
        where: { ticketId: ticket.id }
      });
      const currentUserIds = currentTicketUsers.map(tu => tu.userId).sort();
      const newUserIds = ticketUsers.map(tu => tu.userId).sort();
      hasTicketUsersChanged = JSON.stringify(currentUserIds) !== JSON.stringify(newUserIds);

      // Remover todos os relacionamentos existentes
      await TicketUser.destroy({
        where: { ticketId: ticket.id }
      });

      // Criar novos relacionamentos com filas
      if (ticketUsers.length > 0) {
        await TicketUser.bulkCreate(
          ticketUsers.map(tu => ({
            ticketId: ticket.id,
            userId: tu.userId,
            queueId: tu.queueId || null
          }))
        );
      }

      // Se houver ticketUsers, usar o primeiro como userId principal para compatibilidade
      if (ticketUsers.length > 0) {
        userId = ticketUsers[0].userId;
        // Se o ticket for de grupo e tiver fila no primeiro usuário, vincular ao ticket também
        if (ticket.isGroup && ticketUsers[0].queueId) {
          queueId = ticketUsers[0].queueId;
        }
      } else {
        userId = null;
      }
    } else if (userIds !== undefined && Array.isArray(userIds)) {
      // Compatibilidade com formato antigo (apenas userIds)
      await TicketUser.destroy({
        where: { ticketId: ticket.id }
      });

      if (userIds.length > 0) {
        await TicketUser.bulkCreate(
          userIds.map(uId => ({
            ticketId: ticket.id,
            userId: uId,
            queueId: null
          }))
        );
        userId = userIds[0];
      } else {
        userId = null;
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
    
    // Recarregar ticket com ticketUsers para emitir eventos
    const ticketWithUsers = await ShowTicketService(ticket.id, companyId);

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

    if (ticket.status !== oldStatus || ticket.user?.id !== oldUserId || hasTicketUsersChanged) {

      io.to(`company-${companyId}-${oldStatus}`)
        .to(`queue-${ticket.queueId}-${oldStatus}`)
        .to(`user-${oldUserId}`)
        .emit(`company-${companyId}-ticket`, {
          action: "delete",
          ticketId: ticket.id
        });
    }

    // Emitir evento para todos os usuários atribuídos ao ticket
    const userIdsToNotify = [ticket?.userId, oldUserId].filter(Boolean);
    
    // Se houver ticketUsers, adicionar todos os userIds
    if (ticketWithUsers.ticketUsers && ticketWithUsers.ticketUsers.length > 0) {
      ticketWithUsers.ticketUsers.forEach((tu: any) => {
        if (tu.user && tu.user.id && !userIdsToNotify.includes(tu.user.id)) {
          userIdsToNotify.push(tu.user.id);
        }
      });
    }

    // Emitir para canais padrão
    io.to(`company-${companyId}-${ticket.status}`)
      .to(`company-${companyId}-notification`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-notification`)
      .to(ticketId.toString())
      .emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket: ticketWithUsers
      });

    // Emitir para cada usuário atribuído individualmente (importante para grupos)
    userIdsToNotify.forEach((uid: number) => {
      io.to(`user-${uid}`).emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket: ticketWithUsers
      });
    });
    
    // Se for grupo e houver mudança nos usuários, emitir também para status pending
    if (ticket.isGroup && hasTicketUsersChanged) {
      io.to(`company-${companyId}-pending`)
        .to(`company-${companyId}-notification`)
        .emit(`company-${companyId}-ticket`, {
          action: "update",
          ticket: ticketWithUsers
        });
    }

    return { ticket: ticketWithUsers, oldStatus, oldUserId };
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
};

export default UpdateTicketService;
