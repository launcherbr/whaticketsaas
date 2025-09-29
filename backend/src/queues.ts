
import * as Sentry from "@sentry/node";
import Queue from "bull";
import { addSeconds, differenceInSeconds } from "date-fns";
import { isArray, isEmpty, isNil } from "lodash";
import moment from "moment";
import path from "path";
import { Op, QueryTypes } from "sequelize";
import sequelize from "./database";
import GetDefaultWhatsApp from "./helpers/GetDefaultWhatsApp";
import GetWhatsappWbot from "./helpers/GetWhatsappWbot";
import formatBody from "./helpers/Mustache";
import { MessageData, SendMessage } from "./helpers/SendMessage";
import { getIO } from "./libs/socket";
import { getWbot } from "./libs/wbot";
import Campaign from "./models/Campaign";
import CampaignSetting from "./models/CampaignSetting";
import CampaignShipping from "./models/CampaignShipping";
import Company from "./models/Company";
import Contact from "./models/Contact";
import ContactList from "./models/ContactList";
import ContactListItem from "./models/ContactListItem";
import Plan from "./models/Plan";
import Schedule from "./models/Schedule";
import User from "./models/User";
import Whatsapp from "./models/Whatsapp";
import ShowFileService from "./services/FileServices/ShowService";
import SendWhatsAppMedia, { getMessageOptions } from "./services/WbotServices/SendWhatsAppMedia";
import { ClosedAllOpenTickets } from "./services/WbotServices/wbotClosedTickets";
import FindOrCreateTicketService from "./services/TicketServices/FindOrCreateTicketService";
const fs = require('fs');
const mime = require('mime-types');
const chardet = require('chardet');
import { logger } from "./utils/logger";


const nodemailer = require('nodemailer');
const CronJob = require('cron').CronJob;

const connection = process.env.REDIS_URI || "";
const limiterMax = process.env.REDIS_OPT_LIMITER_MAX || 1;
const limiterDuration = process.env.REDIS_OPT_LIMITER_DURATION || 3000;

interface ProcessCampaignData {
  id: number;
  delay: number;
}

interface PrepareContactData {
  contactId: number;
  campaignId: number;
  delay: number;
  variables: any[];
}

interface DispatchCampaignData {
  campaignId: number;
  campaignShippingId: number;
  contactListItemId: number;
}

export const userMonitor = new Queue("UserMonitor", connection);

export const queueMonitor = new Queue("QueueMonitor", connection);

export const scheduleMonitor = new Queue("ScheduleMonitor", connection);
export const sendScheduledMessages = new Queue(
  "SendSacheduledMessages",
  connection
);

export const schedulesRecorrenci = new Queue("schedulesRecorrenci", connection)

export const messageQueue = new Queue("MessageQueue", connection, {
  limiter: {
    max: limiterMax as number,
    duration: limiterDuration as number
  }
});

export const campaignQueue = new Queue("CampaignQueue", connection);

async function handleSendMessage(job) {
  try {
    const { data } = job;

    const whatsapp = await Whatsapp.findByPk(data.whatsappId);

    if (whatsapp == null) {
      throw Error("Whatsapp não identificado");
    }

    const messageData: MessageData = data.data;

    await SendMessage(whatsapp, messageData);
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error("MessageQueue -> SendMessage: error", e.message);
    throw e;
  }
}



async function handleCloseTicketsAutomatic() {
  const job = new CronJob('*/1 * * * *', async () => {
    const companies = await Company.findAll();
    companies.map(async c => {

      try {
        const companyId = c.id;
        await ClosedAllOpenTickets(companyId);
      } catch (e: any) {
        Sentry.captureException(e);
        logger.error("ClosedAllOpenTickets -> Verify: error", e.message);
        throw e;
      }

    });
  });
  job.start()
}

async function handleSendMessageWbot(job) {
  try {
    const { data } = job;
  
    if(!data.messageData){
		return;
	}
  
    //console.log(data);
  
    const { wbotId, number, text, options } = data.messageData;
 
  
  	//console.log(wbotId);
  
    const wbot = await getWbot(Number(wbotId));
  
  
    
  
    const sentMessage = await wbot.sendMessage(number,{
        text: text
      },
      {
        ...options
      }
    );
  
    //console.log(sentMessage);
  

  } catch (e: any) {
    Sentry.captureException(e);
    logger.error("MessageQueueWbot -> SendMessage: error", e.message);
    throw e;
  }
}

async function handleVerifySchedulesRecorrenci(job) {
  try {
    const { count, rows: schedules } = await Schedule.findAndCountAll({
      where: {
        status: "ENVIADA",
        repeatEvery: {
          [Op.not]: null,
        },
        selectDaysRecorrenci: {
          [Op.not]: '',
        },
      },
      include: [{ model: Contact, as: "contact" }]
    });
    if (count > 0 ) {
      schedules.map(async schedule => {
        if(schedule?.repeatCount === schedule?.repeatEvery){
          
          await schedule.update({
            repeatEvery: null,
            selectDaysRecorrenci: null
          });

        }else{
          await schedule.update({
            sentAt: null
          });
        }
        
        if(schedule?.repeatCount === schedule?.repeatEvery){
          await schedule.update({
            repeatEvery: null,
            selectDaysRecorrenci: null
          });
        }else{
          const newDateRecorrenci = await VerifyRecorrenciDate(schedule);
        }

      });
    }
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error("SendScheduledMessage -> Verify: error", e.message);
    throw e;
  }
}

async function VerifyRecorrenciDate(schedule) {
  const { sendAt,selectDaysRecorrenci } = schedule;
  const originalDate = moment(sendAt);
  
  let dateFound = false;
  const diasSelecionados = selectDaysRecorrenci.split(', '); // Dias selecionados

  let i = 1;
  while (!dateFound) {
    let nextDate = moment(originalDate).add(i, "days");
    nextDate = nextDate.set({
      hour: originalDate.hours(),
      minute: originalDate.minutes(),
      second: originalDate.seconds(),
    });
  
    // Verifica se o dia da semana da próxima data está na lista de dias selecionados
    if (diasSelecionados.includes(nextDate.format('dddd'))) {
      // A data está dentro do período
      // Faça algo aqui se necessário
      let update = schedule?.repeatCount;
      update = update + 1;
    
      await schedule.update({
        status:'PENDENTE',
        sendAt: nextDate.format("YYYY-MM-DD HH:mm:ssZ"),
        repeatCount: update,
      });

      logger.info(`Recorrencia agendada para: ${schedule.contact.name}`);
      
      // Define a variável de controle para indicar que uma data foi encontrada
      dateFound = true;
    }
    i++;
  }
}

async function handleVerifySchedules(job) {
  try {
    const { count, rows: schedules } = await Schedule.findAndCountAll({
      where: {
        status: "PENDENTE",
        sentAt: null,
        sendAt: {
          [Op.gte]: moment().format("YYYY-MM-DD HH:mm:ss"),
          [Op.lte]: moment().add("30", "seconds").format("YYYY-MM-DD HH:mm:ss")
        }
      },
      include: [{ model: Contact, as: "contact" }]
    });
    if (count > 0) {
      schedules.map(async schedule => {
        await schedule.update({
          status: "AGENDADA"
        });
        sendScheduledMessages.add(
          "SendMessage",
          { schedule },
          { delay: 40000 }
        );
        logger.info(`Disparo agendado para: ${schedule.contact.name}`);
      });
    }
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error("SendScheduledMessage -> Verify: error", e.message);
    throw e;
  }
}

async function handleSendScheduledMessage(job) {
  const {
    data: { schedule }
  } = job;
  let scheduleRecord: Schedule | null = null;

  try {
    scheduleRecord = await Schedule.findByPk(schedule.id);
  } catch (e) {
    Sentry.captureException(e);
    logger.info(`Erro ao tentar consultar agendamento: ${schedule.id}`);
  }

  try {
    const whatsapp = await Whatsapp.findByPk(schedule?.whatsappId);
    const queueId = schedule?.queueId;

    const prepareMediaMessage = async (schedule: any) => {
      const url = `public/company${schedule.companyId}/${schedule.mediaPath}`;
      const fileName = path.basename(url);
      const mimeType = mime.lookup(url);
      const buffer = fs.readFileSync(url);
      
      if (!buffer || buffer.length === 0) {
        throw new Error(`Buffer da mídia está vazio para o arquivo: ${url}`);
      }

      const fileType = mimeType.split('/')[0];
      const baseMessage = {
        caption: schedule.body || '',
        fileName: fileName,
        mimetype: mimeType
      };

      switch(fileType) {
        case 'image':
          return { image: buffer, ...baseMessage };
        case 'video':
          return { video: buffer, ...baseMessage };
        case 'audio':
          return { audio: buffer, ptt: false, ...baseMessage };
        default:
          return { document: buffer, ...baseMessage };
      }
    };

    if (schedule?.geral === true) {
      const ticket = await FindOrCreateTicketService(
        schedule.contact,
        schedule.whatsappId,
        0,
        schedule.companyId,
        schedule.contact,
        true
      );

      if (queueId != null) {
        await ticket.update({
          queueId,
          whatsappId: schedule.whatsappId,
          userId: schedule.userId ?? null,
          isGroup: false,
          status: schedule.userId ? "open" : "pending"
        });
      } else {
        await ticket.update({
          whatsappId: schedule.whatsappId,
          isGroup: false,
          status: "pending"
        });
      }

      if (schedule?.mediaPath) {
        try {
          const mediaMessage = await prepareMediaMessage(schedule);
          const wbot = await getWbot(whatsapp.id);
          
          await wbot.sendMessage(
            `${ticket?.contact?.number}@s.whatsapp.net`, 
            mediaMessage
          );
        } catch (mediaError) {
          logger.error(`Erro ao enviar mídia via ticket: ${mediaError}`);
          throw mediaError;
        }
      } else {
        const wbot = await getWbot(whatsapp.id);
        await wbot.sendMessage(`${ticket?.contact?.number}@s.whatsapp.net`, {
          text: schedule?.body
        });
      }
    } else {
      const wbot = await getWbot(whatsapp.id);
      const contactNumber = schedule.contact.number;

      if (schedule?.mediaPath) {
        try {
          const mediaMessage = await prepareMediaMessage(schedule);
          await wbot.sendMessage(
            `${contactNumber}@s.whatsapp.net`, 
            mediaMessage
          );
        } catch (mediaError) {
          logger.error(`Erro ao enviar mídia diretamente: ${mediaError}`);
          throw mediaError;
        }
      } else {
        await wbot.sendMessage(`${contactNumber}@s.whatsapp.net`, {
          text: schedule.body
        });
      }
    }

    await scheduleRecord?.update({
      sentAt: moment().format("YYYY-MM-DD HH:mm"),
      status: "ENVIADA"
    });

    logger.info(`Mensagem agendada enviada para: ${schedule.contact.name}`);
    sendScheduledMessages.clean(15000, "completed");
  } catch (err: any) {
    Sentry.captureException(err);
    await scheduleRecord?.update({
      status: "ERRO"
    });
    logger.error("SendScheduledMessage -> SendMessage: error", err);
    throw err;
  }
}



async function handleVerifyCampaigns(job) {
  /**
   * @todo
   * Implementar filtro de campanhas
   */
  const campaigns: { id: number; scheduledAt: string }[] =
    await sequelize.query(
      `select id, "scheduledAt" from "Campaigns" c
    where "scheduledAt" between now() and now() + '1 hour'::interval and status = 'PROGRAMADA'`,
      { type: QueryTypes.SELECT }
    );

  if (campaigns.length > 0)
    logger.info(`Campanhas encontradas: ${campaigns.length}`);
  
  for (let campaign of campaigns) {
    try {
      const now = moment();
      const scheduledAt = moment(campaign.scheduledAt);
      const delay = scheduledAt.diff(now, "milliseconds");
      logger.info(
        `Campanha enviada para a fila de processamento: Campanha=${campaign.id}, Delay Inicial=${delay}`
      );
      campaignQueue.add(
        "ProcessCampaign",
        {
          id: campaign.id,
          delay
        },
        {
          removeOnComplete: true
        }
      );
    } catch (err: any) {
      Sentry.captureException(err);
    }
  }
}

async function getCampaign(id) {
  return await Campaign.findByPk(id, {
    include: [
      {
        model: ContactList,
        as: "contactList",
        attributes: ["id", "name"],
        include: [
          {
            model: ContactListItem,
            as: "contacts",
            attributes: ["id", "name", "number", "email", "isWhatsappValid"],
            where: { isWhatsappValid: true }
          }
        ]
      },
      {
        model: Whatsapp,
        as: "whatsapp",
        attributes: ["id", "name"]
      },
      {
        model: CampaignShipping,
        as: "shipping",
        include: [{ model: ContactListItem, as: "contact" }]
      }
    ]
  });
}

async function getContact(id) {
  return await ContactListItem.findByPk(id, {
    attributes: ["id", "name", "number", "email"]
  });
}

async function getSettings(campaign) {
  const settings = await CampaignSetting.findAll({
    where: { companyId: campaign.companyId },
    attributes: ["key", "value"]
  });

  let messageInterval: number = 20;
  let longerIntervalAfter: number = 20;
  let greaterInterval: number = 60;
  let variables: any[] = [];

  settings.forEach(setting => {
    if (setting.key === "messageInterval") {
      messageInterval = JSON.parse(setting.value);
    }
    if (setting.key === "longerIntervalAfter") {
      longerIntervalAfter = JSON.parse(setting.value);
    }
    if (setting.key === "greaterInterval") {
      greaterInterval = JSON.parse(setting.value);
    }
    if (setting.key === "variables") {
      variables = JSON.parse(setting.value);
    }
  });

  return {
    messageInterval,
    longerIntervalAfter,
    greaterInterval,
    variables
  };
}

export function parseToMilliseconds(seconds) {
  return seconds * 1000;
}

async function sleep(seconds) {
  logger.info(
    `Sleep de ${seconds} segundos iniciado: ${moment().format("HH:mm:ss")}`
  );
  return new Promise(resolve => {
    setTimeout(() => {
      logger.info(
        `Sleep de ${seconds} segundos finalizado: ${moment().format(
          "HH:mm:ss"
        )}`
      );
      resolve(true);
    }, parseToMilliseconds(seconds));
  });
}

function getCampaignValidMessages(campaign) {
  const messages = [];

  if (!isEmpty(campaign.message1) && !isNil(campaign.message1)) {
    messages.push(campaign.message1);
  }

  if (!isEmpty(campaign.message2) && !isNil(campaign.message2)) {
    messages.push(campaign.message2);
  }

  if (!isEmpty(campaign.message3) && !isNil(campaign.message3)) {
    messages.push(campaign.message3);
  }

  if (!isEmpty(campaign.message4) && !isNil(campaign.message4)) {
    messages.push(campaign.message4);
  }

  if (!isEmpty(campaign.message5) && !isNil(campaign.message5)) {
    messages.push(campaign.message5);
  }

  return messages;
}

function getCampaignValidConfirmationMessages(campaign) {
  const messages = [];

  if (
    !isEmpty(campaign.confirmationMessage1) &&
    !isNil(campaign.confirmationMessage1)
  ) {
    messages.push(campaign.confirmationMessage1);
  }

  if (
    !isEmpty(campaign.confirmationMessage2) &&
    !isNil(campaign.confirmationMessage2)
  ) {
    messages.push(campaign.confirmationMessage2);
  }

  if (
    !isEmpty(campaign.confirmationMessage3) &&
    !isNil(campaign.confirmationMessage3)
  ) {
    messages.push(campaign.confirmationMessage3);
  }

  if (
    !isEmpty(campaign.confirmationMessage4) &&
    !isNil(campaign.confirmationMessage4)
  ) {
    messages.push(campaign.confirmationMessage4);
  }

  if (
    !isEmpty(campaign.confirmationMessage5) &&
    !isNil(campaign.confirmationMessage5)
  ) {
    messages.push(campaign.confirmationMessage5);
  }

  return messages;
}

function getProcessedMessage(msg: string, variables: any[], contact: any) {
  let finalMessage = msg;

  if (finalMessage.includes("{nome}")) {
    finalMessage = finalMessage.replace(/{nome}/g, contact.name);
  }

  if (finalMessage.includes("{email}")) {
    finalMessage = finalMessage.replace(/{email}/g, contact.email);
  }

  if (finalMessage.includes("{numero}")) {
    finalMessage = finalMessage.replace(/{numero}/g, contact.number);
  }

  variables.forEach(variable => {
    if (finalMessage.includes(`{${variable.key}}`)) {
      const regex = new RegExp(`{${variable.key}}`, "g");
      finalMessage = finalMessage.replace(regex, variable.value);
    }
  });

  return finalMessage;
}

export function randomValue(min, max) {
  return Math.floor(Math.random() * max) + min;
}

async function verifyAndFinalizeCampaign(campaign) {
  const { contacts } = campaign.contactList;

  const count1 = contacts.length;
  const count2 = await CampaignShipping.count({
    where: {
      campaignId: campaign.id,
      deliveredAt: {
        [Op.not]: null
      }
    }
  });

  if (count1 === count2) {
    await campaign.update({ status: "FINALIZADA", completedAt: moment() });
  }

  const io = getIO();
  io.to(`company-${campaign.companyId}-mainchannel`).emit(`company-${campaign.companyId}-campaign`, {
    action: "update",
    record: campaign
  });
}

function calculateDelay(index, baseDelay, longerIntervalAfter, greaterInterval, messageInterval) {
  const diffSeconds = differenceInSeconds(baseDelay, new Date());
  if (index > longerIntervalAfter) {
    return diffSeconds * 1000 + greaterInterval
  } else {
    return diffSeconds * 1000 + messageInterval
  }
}

async function handleProcessCampaign(job) {
  try {
    const { id }: ProcessCampaignData = job.data;
    const campaign = await getCampaign(id);
    const settings = await getSettings(campaign);
    if (campaign) {
      const { contacts } = campaign.contactList;
      if (isArray(contacts)) {
        const contactData = contacts.map(contact => ({
          contactId: contact.id,
          campaignId: campaign.id,
          variables: settings.variables,
        }));

        // const baseDelay = job.data.delay || 0;
        const longerIntervalAfter = parseToMilliseconds(settings.longerIntervalAfter);
        const greaterInterval = parseToMilliseconds(settings.greaterInterval);
        const messageInterval = settings.messageInterval;

        let baseDelay = campaign.scheduledAt;

        const queuePromises = [];
        for (let i = 0; i < contactData.length; i++) {
          baseDelay = addSeconds(baseDelay, i > longerIntervalAfter ? greaterInterval : messageInterval);

          const { contactId, campaignId, variables } = contactData[i];
          const delay = calculateDelay(i, baseDelay, longerIntervalAfter, greaterInterval, messageInterval);
          const queuePromise = campaignQueue.add(
            "PrepareContact",
            { contactId, campaignId, variables, delay },
            { removeOnComplete: true }
          );
          queuePromises.push(queuePromise);
          logger.info(`Registro enviado pra fila de disparo: Campanha=${campaign.id};Contato=${contacts[i].name};delay=${delay}`);
        }
        await Promise.all(queuePromises);
        await campaign.update({ status: "EM_ANDAMENTO" });
      }
    }
  } catch (err: any) {
    Sentry.captureException(err);
  }
}

let ultima_msg = 0;
async function handlePrepareContact(job) {
  try {
    const { contactId, campaignId, delay, variables }: PrepareContactData =
      job.data;
    const campaign = await getCampaign(campaignId);
    const contact = await getContact(contactId);

    const campaignShipping: any = {};
    campaignShipping.number = contact.number;
    campaignShipping.contactId = contactId;
    campaignShipping.campaignId = campaignId;

    const messages = getCampaignValidMessages(campaign);
    if (messages.length) {
      const radomIndex = ultima_msg;
      console.log('ultima_msg:', ultima_msg);
      ultima_msg++;
      if (ultima_msg >= messages.length) {
        ultima_msg = 0;
      }
      const message = getProcessedMessage(
        messages[radomIndex],
        variables,
        contact
      );
      campaignShipping.message = `\u200c ${message}`;
    }

    if (campaign.confirmation) {
      const confirmationMessages =
        getCampaignValidConfirmationMessages(campaign);
      if (confirmationMessages.length) {
        const radomIndex = randomValue(0, confirmationMessages.length);
        const message = getProcessedMessage(
          confirmationMessages[radomIndex],
          variables,
          contact
        );
        campaignShipping.confirmationMessage = `\u200c ${message}`;
      }
    }

    const [record, created] = await CampaignShipping.findOrCreate({
      where: {
        campaignId: campaignShipping.campaignId,
        contactId: campaignShipping.contactId
      },
      defaults: campaignShipping
    });

    if (
      !created &&
      record.deliveredAt === null &&
      record.confirmationRequestedAt === null
    ) {
      record.set(campaignShipping);
      await record.save();
    }

    if (
      record.deliveredAt === null &&
      record.confirmationRequestedAt === null
    ) {
      const nextJob = await campaignQueue.add(
        "DispatchCampaign",
        {
          campaignId: campaign.id,
          campaignShippingId: record.id,
          contactListItemId: contactId
        },
        {
          delay
        }
      );

      await record.update({ jobId: nextJob.id });
    }

    await verifyAndFinalizeCampaign(campaign);
  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(`campaignQueue -> PrepareContact -> error: ${err.message}`);
  }
}

async function handleDispatchCampaign(job) {
  try {
    const { data } = job;
    const { campaignShippingId, campaignId }: DispatchCampaignData = data;
    const campaign = await getCampaign(campaignId);
    const wbot = await GetWhatsappWbot(campaign.whatsapp);

    if (!wbot) {
      logger.error(`campaignQueue -> DispatchCampaign -> error: wbot not found`);
      return;
    }

    if (!campaign.whatsapp) {
      logger.error(`campaignQueue -> DispatchCampaign -> error: whatsapp not found`);
      return;
    }

    if (!wbot?.user?.id) {
      logger.error(`campaignQueue -> DispatchCampaign -> error: wbot user not found`);
      return;
    }

    logger.info(
      `Disparo de campanha solicitado: Campanha=${campaignId};Registro=${campaignShippingId}`
    );

    const campaignShipping = await CampaignShipping.findByPk(
      campaignShippingId,
      {
        include: [{ model: ContactListItem, as: "contact" }]
      }
    );

    const chatId = `${campaignShipping.number}@s.whatsapp.net`;

    if (campaign.confirmation && campaignShipping.confirmation === null) {
      await wbot.sendMessage(chatId, {
        text: campaignShipping.confirmationMessage
      });
      await campaignShipping.update({ confirmationRequestedAt: moment() });
    } else {
      await wbot.sendMessage(chatId, {
        text: campaignShipping.message
      });

      if (!isNil(campaign.fileListId)) {
        try {
          const publicFolder = path.resolve(__dirname, "..", "public", `company${campaign.companyId}`);
          const files = await ShowFileService(campaign.fileListId, campaign.companyId);
          const folder = path.resolve(publicFolder, "fileList", String(files.id));
      
          for (const [index, file] of files.options.entries()) {
            const options = await getMessageOptions(file.path, path.resolve(folder, file.path), file.name);
            await wbot.sendMessage(chatId, { ...options });
          }
        } finally {
          // Caso precise executar alguma ação independentemente de erro
        }
      }
      

      if (campaign.mediaPath) {
        //const filePath = path.resolve("public", campaign.mediaPath);
        const filePath = path.resolve(`public/company${campaign.companyId}`, campaign.mediaPath);
        //const options = await getMessageOptions(campaign.mediaName, filePath);
        const options = await getMessageOptions(campaign.mediaName, filePath);
        if (Object.keys(options).length) {
          await wbot.sendMessage(chatId, { ...options });
        }
      }
      await campaignShipping.update({ deliveredAt: moment() });
    }

    await verifyAndFinalizeCampaign(campaign);

    const io = getIO();
    io.to(`company-${campaign.companyId}-mainchannel`).emit(`company-${campaign.companyId}-campaign`, {
      action: "update",
      record: campaign
    });

    logger.info(
      `Campanha enviada para: Campanha=${campaignId};Contato=${campaignShipping.contact.name}`
    );
  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(err.message);
    console.log(err.stack);
  }
}

async function handleLoginStatus(job) {
  const users: { id: number }[] = await sequelize.query(
    `select id from "Users" where "updatedAt" < now() - '5 minutes'::interval and online = true`,
    { type: QueryTypes.SELECT }
  );
  for (let item of users) {
    try {
      const user = await User.findByPk(item.id);
      await user.update({ online: false });
      logger.info(`Usuário passado para offline: ${item.id}`);
    } catch (e: any) {
      Sentry.captureException(e);
    }
  }
}


async function handleInvoiceCreate() {
  logger.info("GERENDO RECEITA...");
  const job = new CronJob('*/1 * * * *', async () => {
    const companies = await Company.findAll();
    companies.map(async c => {
    
      const status = c.status;
      const dueDate = c.dueDate; 
      const date = moment(dueDate).format();
      const timestamp = moment().format();
      const hoje = moment().format("DD/MM/yyyy");
      const vencimento = moment(dueDate).format("DD/MM/yyyy");
      const diff = moment(vencimento, "DD/MM/yyyy").diff(moment(hoje, "DD/MM/yyyy"));
      const dias = moment.duration(diff).asDays();
    
      if(status === true){

      	//logger.info(`EMPRESA: ${c.id} está ATIVA com vencimento em: ${vencimento} | ${dias}`);
      
      	//Verifico se a empresa está a mais de 10 dias sem pagamento
        
        if(dias <= -3){
       
          logger.info(`EMPRESA: ${c.id} está VENCIDA A MAIS DE 3 DIAS... INATIVANDO... ${dias}`);
          c.status = false;
          await c.save(); // Save the updated company record
          logger.info(`EMPRESA: ${c.id} foi INATIVADA.`);
          logger.info(`EMPRESA: ${c.id} Desativando conexões com o WhatsApp...`);
          
          try {
    		const whatsapps = await Whatsapp.findAll({
      		where: {
        		companyId: c.id,
      		},
      			attributes: ['id','status','session'],
    		});

    		for (const whatsapp of whatsapps) {

            	if (whatsapp.session) {
    				await whatsapp.update({ status: "DISCONNECTED", session: "" });
    				const wbot = getWbot(whatsapp.id);
    				await wbot.logout();
                	logger.info(`EMPRESA: ${c.id} teve o WhatsApp ${whatsapp.id} desconectado...`);
  				}
    		}
          
  		  } catch (error) {
    		// Lidar com erros, se houver
    		console.error('Erro ao buscar os IDs de WhatsApp:', error);
    		throw error;
  		  }

        
        }else{ // ELSE if(dias <= -3){
        
          const plan = await Plan.findByPk(c.planId);
        
          const sql = `SELECT * FROM "Invoices" WHERE "companyId" = ${c.id} AND "status" = 'open';`
          const openInvoices = await sequelize.query(sql, { type: QueryTypes.SELECT }) as { id: number, dueDate: Date }[];

          const existingInvoice = openInvoices.find(invoice => moment(invoice.dueDate).format("DD/MM/yyyy") === vencimento);
        
          if (existingInvoice) {
            // Due date already exists, no action needed
            //logger.info(`Fatura Existente`);
        
          } else if (openInvoices.length > 0) {
            const updateSql = `UPDATE "Invoices" SET "dueDate" = '${date}', "updatedAt" = '${timestamp}' WHERE "id" = ${openInvoices[0].id};`;

            await sequelize.query(updateSql, { type: QueryTypes.UPDATE });
        
            logger.info(`Fatura Atualizada ID: ${openInvoices[0].id}`);
        
          } else {
          
            const sql = `INSERT INTO "Invoices" (detail, status, value, "updatedAt", "createdAt", "dueDate", "companyId")
            VALUES ('${plan.name}', 'open', '${plan.value}', '${timestamp}', '${timestamp}', '${date}', ${c.id});`

            const invoiceInsert = await sequelize.query(sql, { type: QueryTypes.INSERT });
        
            logger.info(`Fatura Gerada para o cliente: ${c.id}`);

            // Rest of the code for sending email
          }
        
          
        
        
        } // if(dias <= -6){
        

      }else{ // ELSE if(status === true){
      
      	//logger.info(`EMPRESA: ${c.id} está INATIVA`);
      
      }
    
    

    });
  });

  job.start();
}



handleCloseTicketsAutomatic()

handleInvoiceCreate()

export async function startQueueProcess() {
  logger.info("Iniciando processamento de filas");

  messageQueue.process("SendMessage", handleSendMessage);

  scheduleMonitor.process("Verify", handleVerifySchedules);

  schedulesRecorrenci.process("VerifyRecorrenci", handleVerifySchedulesRecorrenci);

  sendScheduledMessages.process("SendMessage", handleSendScheduledMessage);

  campaignQueue.process("VerifyCampaigns", handleVerifyCampaigns);

  campaignQueue.process("ProcessCampaign", handleProcessCampaign);

  campaignQueue.process("PrepareContact", handlePrepareContact);

  campaignQueue.process("DispatchCampaign", handleDispatchCampaign);

  userMonitor.process("VerifyLoginStatus", handleLoginStatus);

  //queueMonitor.process("VerifyQueueStatus", handleVerifyQueue);



  scheduleMonitor.add(
    "Verify",
    {},
    {
      repeat: { cron: "*/30 * * * * *" }, // De 5s para 30s
      removeOnComplete: true
    }
  );


  campaignQueue.add(
    "VerifyCampaigns",
    {},
    {
      repeat: { cron: "*/5 * * * *", key: "verify-campaing" }, // De 20s para 5 minutos
      removeOnComplete: true
    }
  );


  userMonitor.add(
    "VerifyLoginStatus",
    {},
    {
      repeat: { cron: "*/5 * * * *", key: "verify-login" }, // De 1 minuto para 5 minutos
      removeOnComplete: true
    }
  );

  queueMonitor.add(
    "VerifyQueueStatus",
    {},
    {
      repeat: { cron: "*/20 * * * * *" },
      removeOnComplete: true
    }
  );
}
