import type { DidString } from "@atproto/syntax";
import { createContext } from "react-router";

export const didContext = createContext<DidString>();
