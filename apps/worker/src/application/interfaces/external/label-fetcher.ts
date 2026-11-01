import type { Did } from "@atproto/did";

import type { LabelData } from "../repositories/label-repository.js";

export interface ILabelFetcher {
  fetchByActor: (did: Did) => Promise<LabelData[]>;
}
