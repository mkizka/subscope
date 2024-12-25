import express from "express";
import { pinoHttp } from "pino-http";

import { StartIngestionUseCase } from "./application/start-ingestion-use-case.js";
import { createLogger } from "./logger.js";
import { appInjector } from "./presentation/injector.js";

const app = express();
const PORT = 3001;

app.use(pinoHttp());

const logger = createLogger("server");

app.listen(PORT, () => {
  logger.info(`Appview server listening on port ${PORT}`);
  appInjector.injectClass(StartIngestionUseCase).execute();
});
