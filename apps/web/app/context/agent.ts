import type { Client } from "@atproto/lex";
import { createContext } from "react-router";

export const agentContext = createContext<Client>();
