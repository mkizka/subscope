import type { SubscoAgent } from "@repo/client/api";
import type { IJobQueue } from "@repo/common/domain";
import { createContext } from "react-router";

type ExpressContext = {
  agent: SubscoAgent | null;
  injected: {
    jobQueue: IJobQueue;
  };
};

export const expressContext = createContext<ExpressContext>();
