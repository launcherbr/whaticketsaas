import Bull from 'bull';
import { WAMessage, WAMessageUpdate,   Contact as BContact, } from 'baileys';
import { handleMsgAck } from './wbotMessageListener';
import configLoader from '../ConfigLoaderService/configLoaderService';
import createOrUpdateBaileysService from '../BaileysServices/CreateOrUpdateBaileysService';
import { logger } from '../../utils/logger';

const contactsUpdateQueue = new Bull('contactsUpdateQueue', {
  redis: {
    host: 'localhost',
    port: 6379,
  },
  defaultJobOptions: {
    attempts: configLoader().webhook.attempts, // Número de tentativas em caso de falha
    backoff: {
        type: configLoader().webhook.backoff.type, // Tipo de atraso entre tentativas, pode ser 'fixed' ou 'exponential'
        delay: configLoader().webhook.backoff.delay, // Tempo em milissegundos antes de tentar novamente
    },
    removeOnFail: true, // Remove o job da fila quando falha
    removeOnComplete: true, // Remove o job da fila quando completado com sucesso
},
limiter: {
    max: configLoader().webhook.limiter.max, // Define o número máximo de jobs processados por unidade de tempo
    duration: configLoader().webhook.limiter.duration, // Define a duração em milissegundos durante a qual o limite máximo é aplicado
},
});

contactsUpdateQueue.process(async (job) => {
  const { whatsappId, contacts } = job.data;
  logger.info('Inserindo contatos via Redis')
  await createOrUpdateBaileysService({whatsappId, contacts});
});

export const addContactsUpdateJob = async (whatsappId: number, contacts: BContact[]) => {
  await contactsUpdateQueue.add({ whatsappId, contacts });
};
