import type { Did } from "@atproto/did";
import { cborToLexRecord, readCarStream } from "@atproto/repo";
import { AtUri } from "@atproto/syntax";
import { AtpBaseClient } from "@dawn/client/api";
import type { IDidResolver } from "@dawn/common/domain";
import { Record } from "@dawn/common/domain";
import { isSupportedCollection } from "@dawn/common/utils";
import { z } from "zod";

import type { IRepoFetcher } from "../application/interfaces/repo-fetcher.js";
import type { JobLogger } from "../shared/job.js";

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

  async fetch(did: Did, jobLogger: JobLogger) {
    const totalStartTime = Date.now();

    // DID解決の計測
    const didResolveStart = Date.now();
    const { pds } = await this.didResolver.resolve(did);
    const didResolveTime = Date.now() - didResolveStart;
    await jobLogger.info(
      { did, pds: pds.toString(), duration: didResolveTime },
      "DID resolution completed",
    );

    // リポジトリ取得の計測
    const repoFetchStart = Date.now();
    const repoCar = await this.fetchRepo(did, pds);
    const repoFetchTime = Date.now() - repoFetchStart;
    const repoSizeMB = repoCar.byteLength / (1024 * 1024);
    await jobLogger.info(
      {
        did,
        duration: repoFetchTime,
        sizeBytes: repoCar.byteLength,
        sizeMB: repoSizeMB.toFixed(2),
      },
      "Repository fetch completed",
    );

    // CARストリーム読み込みの計測
    const carStreamStart = Date.now();
    const { blocks } = await readCarStream([repoCar]);
    const carStreamTime = Date.now() - carStreamStart;
    await jobLogger.info(
      { did, duration: carStreamTime },
      "CAR stream reading completed",
    );

    const records: Record[] = [];
    // MSTノードのパスを保存するマップ
    const pathToCid = new Map<string, string>();
    let blockCount = 0;
    let mstNodeCount = 0;
    let recordCount = 0;

    // ブロック処理の計測
    const blockProcessingStart = Date.now();
    for await (const block of blocks) {
      blockCount++;
      const blockStart = Date.now();

      try {
        // CBORデータをデコード
        const data = cborToLexRecord(block.bytes);

        // MSTノードの場合、エントリーを記録
        const mstNodeResult = MstNodeSchema.safeParse(data);
        if (mstNodeResult.success) {
          mstNodeCount++;
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
          recordCount++;
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
        await jobLogger.info(
          { error: String(error), blockCid: String(block.cid) },
          "Failed to process block",
        );
      }

      // 個別ブロックの処理時間が10ms以上かかった場合のみログ出力
      const blockDuration = Date.now() - blockStart;
      if (blockDuration > 10) {
        await jobLogger.info(
          { blockCid: String(block.cid), duration: blockDuration },
          "Slow block processing detected",
        );
      }
    }
    const blockProcessingTime = Date.now() - blockProcessingStart;

    const totalDuration = Date.now() - totalStartTime;
    await jobLogger.info(
      {
        did,
        totalDuration,
        didResolveTime,
        repoFetchTime,
        carStreamTime,
        blockProcessingTime,
        blockCount,
        mstNodeCount,
        recordCount,
        supportedRecordCount: records.length,
        repoSizeMB: repoSizeMB.toFixed(2),
      },
      "Repository fetch completed with performance metrics",
    );

    return records;
  }
}
