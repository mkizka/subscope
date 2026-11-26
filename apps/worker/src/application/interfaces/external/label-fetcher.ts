import type { Did } from "@atproto/did";

import type { LabelData } from "../../../domain/label.js";

export interface ILabelFetcher {
  fetchByAccount: (did: Did) => Promise<LabelData[]>;
}
