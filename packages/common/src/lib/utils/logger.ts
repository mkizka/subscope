import { pino } from "pino";

export const createRootLogger = ({ level }: { level: string }) => {
  return pino({
    customLevels: {
      error: 50,
      warn: 40,
      info: 30,
      debug: 20,
    },
    useOnlyCustomLevels: true,
    level,
    // disable pid and hostname in logs
    base: null,
    formatters: {
      level: (label) => ({ level: label }),
    },
  });
};
