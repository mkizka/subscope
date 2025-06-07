import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { AtpBaseClient } from "@dawn/client/api";
import type { IDidResolver } from "@dawn/common/domain";
import { Record } from "@dawn/common/domain";

import type { IProfileRecordFetcher } from "../application/interfaces/profile-record-fetcher.js";

export class ProfileRecordFetcher implements IProfileRecordFetcher {
  static inject = ["didResolver"] as const;

  constructor(private readonly didResolver: IDidResolver) {}

  async fetch(did: Did): Promise<Record | null> {
    // DIDからPDSを解決
    const { pds } = await this.didResolver.resolve(did);
    const client = new AtpBaseClient(pds);

    // プロファイルレコードを取得
    const response = await client.com.atproto.repo.getRecord({
      repo: did,
      collection: "app.bsky.actor.profile",
      rkey: "self",
    });
    if (!response.success) {
      return null;
    }

    const cid = response.data.cid;
    if (!cid) {
      return null;
    }

    const record = Record.fromLex({
      uri: new AtUri(response.data.uri),
      cid,
      lex: response.data.value,
    });
    return record;
  }
}
