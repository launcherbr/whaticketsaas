import gracefulShutdown from "http-graceful-shutdown";
import app from "./app";
import { initIO } from "./libs/socket";
import { logger } from "./utils/logger";
import { StartAllWhatsAppsSessions } from "./services/WbotServices/StartAllWhatsAppsSessions";
import Company from "./models/Company";
import { startQueueProcess } from "./queues";
import { TransferTicketQueue } from "./wbotTransferTicketQueue";
import cron from "node-cron";


const server = app.listen(process.env.PORT, async () => {
  const companies = await Company.findAll();
  const allPromises: any[] = [];
  companies.map(async c => {
  
  	if(c.status === true){  
    	const promise = StartAllWhatsAppsSessions(c.id);
    	allPromises.push(promise);
    }else{
    	logger.info(`Empresa INATIVA: ${c.id} | ${c.name}`);
    }
  
  });

  Promise.all(allPromises).then(() => {
    startQueueProcess();
  });
  logger.info(`Server started on port: ${process.env.PORT}`);
});

process.on("uncaughtException", err => {
  console.error(`${new Date().toUTCString()} uncaughtException:`, err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, p) => {
  console.error(
    `${new Date().toUTCString()} unhandledRejection:`,
    reason,
    p
  );
  process.exit(1);
});


cron.schedule("*/5 * * * *", async () => {  // De 1 minuto para 5 minutos
  try {
    logger.info(`Serviço de transferência de tickets iniciado`);
    await TransferTicketQueue();
  } catch (error) {
    logger.error("Error in cron job:", error);
  }
});



initIO(server);

// Configure graceful shutdown to handle all outstanding promises
gracefulShutdown(server, {
  signals: "SIGINT SIGTERM",
  timeout: 30000, // 30 seconds
  onShutdown: async () => {
    logger.info("Gracefully shutting down...");
    // Add any other cleanup code here, if necessary
  },
  finally: () => {
    logger.info("Server shutdown complete.");
  }
});
