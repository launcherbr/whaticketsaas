import { Op } from "sequelize";
import moment from "moment";
import Contact from "../models/Contact";
import Setting from "../models/Setting";
import Company from "../models/Company";
import Whatsapp from "../models/Whatsapp";
import Ticket from "../models/Ticket";
import Message from "../models/Message";
import { logger } from "../utils/logger";
import SendWhatsAppMessage from "./WbotServices/SendWhatsAppMessage";
import FindOrCreateTicketService from "./TicketServices/FindOrCreateTicketService";
import formatBody from "../helpers/Mustache";
import { getWbot } from "../libs/wbot";

const BirthdayReminderService = async (): Promise<void> => {
  try {
    logger.info(`🎂 Iniciando verificação de aniversários - ${moment().format("DD/MM/YYYY HH:mm:ss")}`);
    
    // Busca todas as empresas
    const companies = await Company.findAll({
      attributes: ["id"]
    });

    logger.info(`Encontradas ${companies.length} empresa(s) para verificar`);

    for (const company of companies) {
      try {
        // Verifica se o aviso de aniversariantes está habilitado
        const birthdayReminderSetting = await Setting.findOne({
          where: {
            key: "birthdayReminderEnabled",
            companyId: company.id,
            value: "enabled"
          }
        });

        if (!birthdayReminderSetting) {
          continue; // Pula para a próxima empresa se não estiver habilitado
        }

        // Busca o horário de disparo configurado
        const birthdayReminderTimeSetting = await Setting.findOne({
          where: {
            key: "birthdayReminderTime",
            companyId: company.id
          }
        });

        const reminderTime = String(birthdayReminderTimeSetting?.value || "09:00");
        const timeParts = reminderTime.split(":");
        const reminderHour = parseInt(timeParts[0] || "9", 10);
        const reminderMinute = parseInt(timeParts[1] || "0", 10);
        
        const now = moment();
        const currentHour = now.hour();
        const currentMinute = now.minute();

        // Verifica se é o horário configurado (verifica se é exatamente o horário ou até 1 minuto depois)
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        const reminderTimeInMinutes = reminderHour * 60 + reminderMinute;
        const timeDiff = currentTimeInMinutes - reminderTimeInMinutes;
        
        // Só executa se estiver no horário exato ou até 1 minuto depois (para garantir que não perca)
        if (timeDiff < 0 || timeDiff > 1) {
          // Não é o horário configurado ainda, ou já passou mais de 1 minuto
          continue;
        }
        
        logger.info(`✅ Horário de disparo atingido para empresa ${company.id}: ${reminderTime} (atual: ${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')})`);

        // Busca a mensagem de aniversário
        const birthdayMessageSetting = await Setting.findOne({
          where: {
            key: "birthdayMessage",
            companyId: company.id
          }
        });

        if (!birthdayMessageSetting || !birthdayMessageSetting.value) {
          continue; // Pula se não houver mensagem configurada
        }

        const birthdayMessage = birthdayMessageSetting.value;
        
        logger.info(`Verificando aniversários para empresa ${company.id} - Horário configurado: ${reminderTime}, Horário atual: ${currentHour}:${String(currentMinute).padStart(2, '0')}`);

        // Busca o WhatsApp padrão da empresa
        const whatsapp = await Whatsapp.findOne({
          where: {
            companyId: company.id,
            isDefault: true,
            status: "CONNECTED"
          }
        });

        if (!whatsapp) {
          continue; // Pula se não houver WhatsApp conectado
        }

        // Busca a sessão do WhatsApp
        let wbot;
        try {
          wbot = getWbot(whatsapp.id!);
          logger.info(`Sessão do WhatsApp ${whatsapp.id} encontrada para empresa ${company.id}`);
        } catch (err) {
          logger.error(`Erro ao obter sessão do WhatsApp ${whatsapp.id}: ${err}`);
          continue; // Pula se não houver sessão ativa
        }
        
        if (!wbot) {
          logger.warn(`Sessão do WhatsApp ${whatsapp.id} não encontrada para empresa ${company.id}`);
          continue; // Pula se não houver sessão ativa
        }

        // Data de hoje no formato YYYY-MM-DD (usando timezone local para comparar com data salva)
        const today = moment().format("YYYY-MM-DD");
        const todayMonthDay = moment().format("MM-DD");
        
        logger.info(`Verificando aniversários para empresa ${company.id} - Data de hoje: ${today} (${todayMonthDay})`);

        // Busca contatos com aniversário hoje
        const contacts = await Contact.findAll({
          where: {
            companyId: company.id,
            birthday: {
              [Op.not]: null
            },
            active: true,
            isGroup: false
          }
        });

        logger.info(`Encontrados ${contacts.length} contato(s) com aniversário cadastrado para empresa ${company.id}`);

        for (const contact of contacts) {
          try {
            if (!contact.birthday) {
              continue;
            }

            // Extrai mês e dia da data de aniversário
            // O birthday pode vir como Date, string (YYYY-MM-DD), ou outro formato
            const birthdayValue = contact.getDataValue('birthday') as any;
            let contactMonth: string;
            let contactDay: string;
            
            // Primeiro, tenta extrair diretamente da string se for formato YYYY-MM-DD
            if (typeof birthdayValue === 'string') {
              const birthdayStr = String(birthdayValue).trim();
              // Remove qualquer parte de hora se existir (YYYY-MM-DD HH:mm:ss)
              const dateOnly = birthdayStr.split(' ')[0];
              if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
                // Formato YYYY-MM-DD - extrai diretamente (mais confiável)
                const dateParts = dateOnly.split('-');
                contactMonth = dateParts[1];
                contactDay = dateParts[2];
                logger.info(`✅ Extraído diretamente da string: ${contactMonth}-${contactDay} de ${dateOnly}`);
              } else {
                // Tenta converter para Date e extrair
                const birthdayDate = new Date(birthdayStr);
                if (!isNaN(birthdayDate.getTime())) {
                  contactMonth = String(birthdayDate.getMonth() + 1).padStart(2, '0');
                  contactDay = String(birthdayDate.getDate()).padStart(2, '0');
                  logger.info(`Extraído de Date convertido: ${contactMonth}-${contactDay} de ${birthdayStr}`);
                } else {
                  logger.error(`❌ Data inválida para ${contact.name}: ${birthdayStr}`);
                  continue;
                }
              }
            } else if (birthdayValue instanceof Date) {
              // Se é Date, extrai mês e dia usando métodos locais (não UTC)
              contactMonth = String(birthdayValue.getMonth() + 1).padStart(2, '0');
              contactDay = String(birthdayValue.getDate()).padStart(2, '0');
              logger.info(`Extraído de Date: ${contactMonth}-${contactDay}`);
            } else if (birthdayValue) {
              // Tenta converter para Date
              const birthdayDate = new Date(birthdayValue);
              if (!isNaN(birthdayDate.getTime())) {
                contactMonth = String(birthdayDate.getMonth() + 1).padStart(2, '0');
                contactDay = String(birthdayDate.getDate()).padStart(2, '0');
                logger.info(`Extraído de Date (fallback): ${contactMonth}-${contactDay}`);
              } else {
                logger.error(`❌ Data inválida para ${contact.name}: ${birthdayValue}`);
                continue;
              }
            } else {
              logger.error(`❌ Sem data de aniversário para ${contact.name}`);
              continue;
            }
            
            const contactMonthDay = `${contactMonth}-${contactDay}`;
            
            logger.info(`🔍 Verificando aniversário: Contato ${contact.name} (ID: ${contact.id}) - Data salva: ${contact.birthday} (tipo: ${typeof birthdayValue}, valor bruto: ${birthdayValue}) - Mês/Dia extraído: ${contactMonthDay} - Hoje: ${todayMonthDay}`);
            
            if (contactMonthDay !== todayMonthDay) {
              logger.info(`❌ Não é aniversário hoje para ${contact.name}: ${contactMonthDay} !== ${todayMonthDay}`);
              continue; // Não é aniversário hoje
            }
            
            logger.info(`✅✅✅ ANIVERSÁRIO DETECTADO para ${contact.name}! (${contactMonthDay} === ${todayMonthDay}) Enviando mensagem...`);

            // Verifica se já foi enviada mensagem de aniversário hoje
            const todayStart = moment().startOf("day").toDate();
            const todayEnd = moment().endOf("day").toDate();

            const existingTicket = await Ticket.findOne({
              where: {
                contactId: contact.id,
                companyId: company.id
              }
            });

            if (existingTicket) {
              // Verifica se já existe mensagem de aniversário enviada hoje
              const existingMessage = await Message.findOne({
                where: {
                  ticketId: existingTicket.id,
                  fromMe: true,
                  createdAt: {
                    [Op.gte]: todayStart,
                    [Op.lte]: todayEnd
                  }
                },
                order: [["createdAt", "DESC"]]
              });

              // Se já existe mensagem enviada hoje, verifica se é de aniversário
              if (existingMessage) {
                // Verifica se a mensagem contém parte da mensagem de aniversário configurada
                const messagePreview = birthdayMessage.substring(0, 30).toLowerCase();
                const existingBody = existingMessage.body?.toLowerCase() || "";
                if (existingBody.includes(messagePreview) || existingBody.includes("aniversário") || existingBody.includes("aniversario") || existingBody.includes("parabéns") || existingBody.includes("parabens")) {
                  logger.info(`⏭️ Mensagem de aniversário já enviada hoje para ${contact.name}, pulando...`);
                  continue; // Já foi enviada mensagem de aniversário hoje
                }
              }
            }

            // Calcula a idade - precisa da data completa para calcular
            let birthdayDateForAge: Date;
            if (typeof birthdayValue === 'string') {
              const birthdayStr = String(birthdayValue).trim().split(' ')[0];
              if (/^\d{4}-\d{2}-\d{2}$/.test(birthdayStr)) {
                const dateParts = birthdayStr.split('-');
                const year = parseInt(dateParts[0], 10);
                const month = parseInt(dateParts[1], 10);
                const day = parseInt(dateParts[2], 10);
                birthdayDateForAge = new Date(year, month - 1, day);
              } else {
                birthdayDateForAge = new Date(birthdayStr);
              }
            } else if (birthdayValue instanceof Date) {
              birthdayDateForAge = birthdayValue;
            } else {
              birthdayDateForAge = new Date(birthdayValue);
            }
            
            const age = moment().diff(moment(birthdayDateForAge), "years");
            logger.info(`Idade calculada para ${contact.name}: ${age} anos`);

            // Substitui variáveis na mensagem
            let finalMessage = birthdayMessage;
            finalMessage = finalMessage.replace(/\{\{name\}\}/g, contact.name || "Cliente");
            finalMessage = finalMessage.replace(/\{\{idade\}\}/g, age.toString());

            // Busca ou cria ticket para o contato
            const ticket = await FindOrCreateTicketService(
              contact,
              whatsapp.id!,
              0,
              company.id
            );

            // Envia a mensagem
            await SendWhatsAppMessage({
              body: formatBody(finalMessage, contact),
              ticket
            });

            logger.info(`Mensagem de aniversário enviada para ${contact.name} (${contact.number}) - Empresa ${company.id}`);
          } catch (err) {
            logger.error(`Erro ao enviar mensagem de aniversário para contato ${contact.id}: ${err}`);
          }
        }
      } catch (err) {
        logger.error(`Erro ao processar aniversários para empresa ${company.id}: ${err}`);
      }
    }
  } catch (err) {
    logger.error(`Erro no serviço de aniversários: ${err}`);
  }
};

export default BirthdayReminderService;

