import type { Did } from "@atproto/did";
import type { JobData } from "@repo/common/domain";

export interface ILabelFetcher {
  fetchByActor: (did: Did) => Promise<JobData["label"][]>;
}
