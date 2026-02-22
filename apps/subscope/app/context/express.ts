import type { IJobQueue, ILoggerManager } from "@repo/common/domain";
import { createContext } from "react-router";

type ExpressContext = {
  injected: {
    jobQueue: IJobQueue;
    loggerManager: ILoggerManager;
  };
};

export const expressContext = createContext<ExpressContext>();
