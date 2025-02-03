import type { AtUri } from "@atproto/syntax";
import type { AppBskyFeedPost } from "@dawn/client";
import { lexicons } from "@dawn/client";
import type { Record, TransactionContext } from "@dawn/common/domain";
import { Actor, Post } from "@dawn/common/domain";

import type { IActorRepository } from "../interfaces/actor-repository.js";
import type { IPostRepository } from "../interfaces/post-repository.js";

export class IndexPostService {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly actorRepository: IActorRepository,
  ) {}
  static inject = ["postRepository", "actorRepository"] as const;

  private assertRecord(json: unknown): asserts json is AppBskyFeedPost.Record {
    lexicons.assertValidRecord("app.bsky.feed.post", json);
  }

  private createPost(record: Record) {
    this.assertRecord(record.json);
    return new Post({
      rkey: record.uri.rkey,
      actorDid: record.actorDid,
      text: record.json.text,
      langs: record.json.langs ?? [],
      createdAt: new Date(record.json.createdAt),
    });
  }

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const post = this.createPost(record);
    const exists = await this.actorRepository.exists({
      ctx,
      did: post.actorDid,
    });
    if (!exists) {
      const actor = new Actor({ did: post.actorDid });
      await Promise.all([
        // ポストの数が多すぎてジョブが詰まってしまうため解決策を思いつくまで無効化
        // TODO: did解決出来ていない投稿者への対策を考える
        // this.jobQueue.add("resolveDid", dto.actorDid),
        this.actorRepository.createOrUpdate({ ctx, actor }),
      ]);
    }
    await this.postRepository.createOrUpdate({ ctx, post });
  }

  async delete({ ctx, uri }: { ctx: TransactionContext; uri: AtUri }) {
    // TODO: 削除処理
  }
}
