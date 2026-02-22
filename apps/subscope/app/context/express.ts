import type { IJobQueue } from "@repo/common/domain";
import { createContext } from "react-router";

type ExpressContext = {
  injected: {
    jobQueue: IJobQueue;
  };
};

export const expressContext = createContext<ExpressContext>();
