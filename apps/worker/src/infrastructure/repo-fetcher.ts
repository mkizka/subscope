import type { Did } from "@atproto/did";
import { cborToLexRecord, readCarStream } from "@atproto/repo";
import { AtUri } from "@atproto/syntax";
import { AtpBaseClient } from "@dawn/client/api";
import type { IDidResolver, ILoggerManager } from "@dawn/common/domain";
import { Record } from "@dawn/common/domain";
import { isSupportedCollection } from "@dawn/common/utils";
import { z } from "zod";

import type { IRepoFetcher } from "../application/interfaces/repo-fetcher.js";

// MSTノードのエントリー
const MstEntrySchema = z.object({
  k: z.string(),
  v: z.unknown().transform((val) => String(val)),
});

// MSTノードのスキーマ
const MstNodeSchema = z.object({
  e: z.array(MstEntrySchema),
});

// AT Protocolレコードのスキーマ
const AtProtoRecordSchema = z.object({
  $type: z.string(),
});

export class RepoFetcher implements IRepoFetcher {
  private readonly logger;

  constructor(
    private readonly didResolver: IDidResolver,
    private readonly loggerManager: ILoggerManager,
  ) {
    this.logger = loggerManager.createLogger("RepoFetcher");
  }
  static inject = ["didResolver", "loggerManager"] as const;

  private async fetchRepo(did: Did, pds: URL) {
    const client = new AtpBaseClient(pds);
    const response = await client.com.atproto.sync.getRepo({ did });
    if (!response.success) {
      throw new Error("Failed to fetch repo");
    }
    return response.data;
  }

  async fetch(did: Did) {
    const { pds } = await this.didResolver.resolve(did);
    const repoCar = await this.fetchRepo(did, pds);

    const { blocks } = await readCarStream([repoCar]);
    const records: Record[] = [];

    // MSTノードのパスを保存するマップ
    const pathToCid = new Map<string, string>();

    for await (const block of blocks) {
      try {
        // CBORデータをデコード
        const data = cborToLexRecord(block.bytes);

        // MSTノードの場合、エントリーを記録
        const mstNodeResult = MstNodeSchema.safeParse(data);
        if (mstNodeResult.success) {
          for (const entry of mstNodeResult.data.e) {
            pathToCid.set(entry.k, entry.v);
          }
          continue;
        }

        // AT Protocolレコードの場合
        const recordResult = AtProtoRecordSchema.safeParse(data);
        if (
          recordResult.success &&
          isSupportedCollection(recordResult.data.$type)
        ) {
          // パスからコレクションとrkeyを探す
          const blockCid = String(block.cid);
          for (const [path, cid] of pathToCid) {
            if (cid === blockCid) {
              const parts = path.split("/");
              if (parts.length === 2) {
                records.push(
                  Record.fromLex({
                    uri: AtUri.make(did, parts[0], parts[1]),
                    cid: blockCid,
                    lex: data,
                  }),
                );
                break;
              }
            }
          }
        }
      } catch (error) {
        this.logger.warn(
          { error, blockCid: String(block.cid) },
          "Failed to process block",
        );
      }
    }
    return records;
  }
}
