import { jsonToLex } from "@atproto/lexicon";
import type { AppBskyFeedPost } from "@dawn/client";
import client from "@dawn/client";
import type { Record, TransactionContext } from "@dawn/common/domain";
import { Post } from "@dawn/common/domain";

import type { IPostRepository } from "../interfaces/post-repository.js";

export class IndexPostService {
  constructor(private readonly postRepository: IPostRepository) {}
  static inject = ["postRepository"] as const;

  private assertRecord(json: unknown): asserts json is AppBskyFeedPost.Record {
    client.lexicons.assertValidRecord("app.bsky.feed.post", jsonToLex(json));
  }

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    this.assertRecord(record.json);
    const post = new Post({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      text: record.json.text,
      langs: record.json.langs ?? [],
      createdAt: new Date(record.json.createdAt),
    });
    await this.postRepository.upsert({ ctx, post });
  }
}
