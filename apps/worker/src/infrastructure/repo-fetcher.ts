import type { Did } from "@atproto/did";
import { cborToLexRecord, verifyRepoCar } from "@atproto/repo";
import { AtUri } from "@atproto/syntax";
import { AtpBaseClient } from "@dawn/client";
import type { IDidResolver } from "@dawn/common/domain";
import { Record } from "@dawn/common/domain";
import { required } from "@dawn/common/utils";

import type { IRepoFetcher } from "../application/interfaces/repo-fetcher.js";

export class RepoFetcher implements IRepoFetcher {
  constructor(private readonly didResolver: IDidResolver) {}
  static inject = ["didResolver"] as const;

  private async fetchRepo(did: Did, pds: URL) {
    const client = new AtpBaseClient(pds);
    const response = await client.com.atproto.sync.getRepo({ did });
    if (!response.success) {
      throw new Error("Failed to fetch repo");
    }
    return response.data;
  }

  private async fetchRepoAndVerify(did: Did) {
    const { pds, signingKey } = await this.didResolver.resolve(did);
    const repoCar = await this.fetchRepo(did, pds);
    return await verifyRepoCar(repoCar, did, signingKey);
  }

  async fetch(did: Did) {
    const { creates, commit } = await this.fetchRepoAndVerify(did);
    return creates.map((create) => {
      const cbor = required(commit.newBlocks.get(create.cid));
      const record = cborToLexRecord(cbor);
      return Record.fromLex({
        uri: AtUri.make(did, create.collection, create.rkey),
        cid: create.cid.toString(),
        lex: record,
      });
    });
  }
}
