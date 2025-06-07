import type { Did } from "@atproto/did";
import { cborToLexRecord, verifyRepoCar } from "@atproto/repo";
import { AtUri } from "@atproto/syntax";
import { AtpBaseClient } from "@dawn/client/api";
import type { IDidResolver } from "@dawn/common/domain";
import { Record } from "@dawn/common/domain";
import { required } from "@dawn/common/utils";

import type { IRepoFetcher } from "../application/interfaces/repo-fetcher.js";
import type { JobLogger } from "../shared/job.js";

export class RepoFetcher implements IRepoFetcher {
  constructor(private readonly didResolver: IDidResolver) {}
  static inject = ["didResolver"] as const;

  private async measureAndLog<T>(
    jobLogger: JobLogger,
    taskName: string,
    data: { [key: string]: unknown },
    task: () => Promise<T>,
  ): Promise<T> {
    await jobLogger.info(data, `${taskName}を開始`);
    const startTime = Date.now();

    const result = await task();

    const duration = Date.now() - startTime;
    await jobLogger.info({ ...data, duration }, `${taskName}完了`);

    return result;
  }

  private async fetchRepo(did: Did, pds: URL, jobLogger: JobLogger) {
    const client = new AtpBaseClient(pds);

    return this.measureAndLog(
      jobLogger,
      "リポジトリの取得",
      { did },
      async () => {
        const response = await client.com.atproto.sync.getRepo({ did });
        if (!response.success) {
          throw new Error("Failed to fetch repo");
        }
        return response.data;
      },
    );
  }

  private async fetchRepoAndVerify(did: Did, jobLogger: JobLogger) {
    const { pds, signingKey } = await this.measureAndLog(
      jobLogger,
      "DID解決",
      { did },
      () => this.didResolver.resolve(did),
    );

    const repoCar = await this.fetchRepo(did, pds, jobLogger);

    const result = await this.measureAndLog(
      jobLogger,
      "リポジトリ検証",
      { did },
      () => verifyRepoCar(repoCar, did, signingKey),
    );

    return result;
  }

  async fetch(did: Did, jobLogger: JobLogger) {
    return this.measureAndLog(
      jobLogger,
      "レコード取得処理",
      { did },
      async () => {
        const { creates, commit } = await this.fetchRepoAndVerify(
          did,
          jobLogger,
        );

        const records = await this.measureAndLog(
          jobLogger,
          "レコード変換",
          { recordCount: creates.length },
          () =>
            Promise.resolve(
              creates.map((create) => {
                const cbor = required(commit.newBlocks.get(create.cid));
                const record = cborToLexRecord(cbor);
                return Record.fromLex({
                  uri: AtUri.make(did, create.collection, create.rkey),
                  cid: create.cid.toString(),
                  lex: record,
                });
              }),
            ),
        );

        return records;
      },
    );
  }
}
