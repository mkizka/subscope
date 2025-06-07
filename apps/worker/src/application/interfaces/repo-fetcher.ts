import type { Did } from "@atproto/did";
import type { Record } from "@dawn/common/domain";

import type { JobLogger } from "../../shared/job.js";

export interface IRepoFetcher {
  fetch: (did: Did, jobLogger: JobLogger) => Promise<Record[]>;
}
