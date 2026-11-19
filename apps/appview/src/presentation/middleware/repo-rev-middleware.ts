import type { Did } from "@atproto/did";

import type { IAccountQuery } from "../../application/interfaces/queries/account-query.js";

export class RepoRevMiddleware {
  constructor(private readonly accountQuery: IAccountQuery) {}

  async headers(viewerDid: Did | null) {
    if (!viewerDid) {
      return undefined;
    }
    const rev = await this.accountQuery.findRepoRev(viewerDid);
    return rev ? { "atproto-repo-rev": rev } : undefined;
  }
}
