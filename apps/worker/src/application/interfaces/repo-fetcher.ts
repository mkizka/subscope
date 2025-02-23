import type { Record } from "@dawn/common/domain";

export interface IRepoFetcher {
  fetch: (pds: string) => Promise<Record[]>;
}
