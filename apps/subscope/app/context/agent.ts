import type { SubscoAgent } from "@repo/client/api";
import { createContext } from "react-router";

export const agentContext = createContext<SubscoAgent>();
