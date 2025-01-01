import { createRootLogger } from "@dawn/common";

import { env } from "./env.js";

const rootLogger = createRootLogger({ level: env.LOG_LEVEL });

export const createLogger = (name: string) => rootLogger.child({ name });
