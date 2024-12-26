import { pino } from "pino";

const logger = pino();

export const createLogger = (name: string) => logger.child({ name });
