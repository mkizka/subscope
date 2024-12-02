import express from "express";
import { pinoHttp } from "pino-http";

import { createLogger } from "./logger.js";
import { jetstream } from "./subscription.js";

const app = express();
const PORT = 3001;

app.use(pinoHttp());

const logger = createLogger("server");

app.get("/", (_, res) => {
  res.send("Hello World!");
});

jetstream.start();

app.listen(PORT, () => {
  logger.info(`Appview server listening on port ${PORT}`);
});
