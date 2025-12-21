import type { Did } from "@atproto/did";
import { lexToJson } from "@atproto/lexicon";
import { cborToLexRecord, verifyRepoCar } from "@atproto/repo";
import { AtUri } from "@atproto/syntax";
import { AtpBaseClient } from "@repo/client/api";
import type { IDidResolver } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { required } from "@repo/common/utils";

import type { IRepoFetcher } from "../../../application/interfaces/external/repo-fetcher.js";
import type { JobLogger } from "../../../shared/job.js";
import { Timer } from "../../../shared/timer.js";

const cborToJson = (cbor: Uint8Array) => {
  const lex = cborToLexRecord(cbor);
  return lexToJson(lex);
};

export class RepoFetcher implements IRepoFetcher {
  private timer = new Timer();

  constructor(private readonly didResolver: IDidResolver) {}
  static inject = ["didResolver"] as const;

  async fetch(did: Did, jobLogger: JobLogger) {
    this.timer.start();
    const { pds, signingKey } = await this.didResolver.resolve(did);
    await jobLogger.log(`DID解決完了: ${this.timer.end()} ms`);

    this.timer.start();
    const client = new AtpBaseClient(pds);
    const response = await client.com.atproto.sync.getRepo({ did });
    await jobLogger.log(`getRepo API呼び出し: ${this.timer.end()} ms`);
    if (!response.success) {
      throw new Error("Failed to fetch repo");
    }

    this.timer.start();
    const { creates, commit } = await verifyRepoCar(
      response.data,
      did,
      signingKey,
    );
    await jobLogger.log(`verifyRepoCar: ${this.timer.end()} ms`);

    this.timer.start();
    const records = creates.map((create) => {
      const cbor = required(commit.newBlocks.get(create.cid));
      return Record.create({
        uri: AtUri.make(did, create.collection, create.rkey),
        cid: String(create.cid),
        json: cborToJson(cbor),
      });
    });
    await jobLogger.log(`レコード変換: ${this.timer.end()} ms`);

    return records;
  }
}
