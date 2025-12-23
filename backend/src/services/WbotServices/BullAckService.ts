import Bull from 'bull';
import { WAMessage, WAMessageUpdate } from 'baileys';
import { handleMsgAck } from './wbotMessageListener';
import configLoader from '../ConfigLoaderService/configLoaderService';

const msgAckQueue = new Bull('msgAckQueue', {
  redis: {
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null
  },
  defaultJobOptions: {
    attempts: configLoader().webhook.attempts,
    backoff: {
        type: configLoader().webhook.backoff.type,
        delay: configLoader().webhook.backoff.delay,
    },
    removeOnFail: true,
    removeOnComplete: true,
  },
  limiter: {
    max: configLoader().webhook.limiter.max,
    duration: configLoader().webhook.limiter.duration,
  },
});


msgAckQueue.process(async (job) => {
  const { msg, chat } = job.data;
  try {
    await handleMsgAck(msg, chat);
    // Remover o job após um atraso de 5 segundos
    setTimeout(() => {
      job.remove()
        .then(() => {
          //console.log(`Job ${job.id} removido com sucesso após conclusão.`);
        })
        .catch(err => {
          //console.log(`Erro ao remover job ${job.id}: ${err}`);
        });
    }, 5000);
  } catch (error) {
    //console.error('Erro ao processar o job:', error);
    // Você também pode remover o job em caso de erro, caso deseje
    // await job.remove();
  }
});

export const addMsgAckJob = async (msg: WAMessageUpdate, chat: number | null | undefined) => {
  await msgAckQueue.add({ msg, chat });
};
