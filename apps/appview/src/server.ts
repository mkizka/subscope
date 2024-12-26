import express from "express";
import { pinoHttp } from "pino-http";

import { Ingester } from "./infrastructure/ingester.js";
import { appInjector } from "./presentation/injector.js";
import { createLogger } from "./shared/logger.js";

const app = express();
const PORT = 3001;

app.use(pinoHttp());

const logger = createLogger("server");

const ingester = appInjector.injectClass(Ingester);

app.listen(PORT, () => {
  logger.info(`Appview server listening on port ${PORT}`);
  ingester.start();
});
