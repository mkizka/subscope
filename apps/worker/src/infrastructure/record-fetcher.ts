import { asDid } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import { AtpBaseClient } from "@repo/client/api";
import type { IDidResolver } from "@repo/common/domain";
import { Record } from "@repo/common/domain";

import type { IRecordFetcher } from "../application/interfaces/external/record-fetcher.js";

export class RecordFetcher implements IRecordFetcher {
  static inject = ["didResolver"] as const;

  constructor(private readonly didResolver: IDidResolver) {}

  async fetch(uri: AtUri): Promise<Record | null> {
    try {
      // URIからDIDを抽出
      const did = asDid(uri.hostname);

      // DIDからPDSを解決
      const { pds } = await this.didResolver.resolve(did);
      const client = new AtpBaseClient(pds);

      // レコードを取得
      const response = await client.com.atproto.repo.getRecord({
        repo: did,
        collection: uri.collection,
        rkey: uri.rkey,
      });

      if (!response.success) {
        return null;
      }

      const cid = response.data.cid;
      if (!cid) {
        return null;
      }

      const record = Record.fromLex({
        uri,
        cid,
        lex: response.data.value,
      });
      return record;
    } catch (error) {
      // エラーが発生した場合はnullを返す
      return null;
    }
  }
}
