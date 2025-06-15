import type { AtUri } from "@atproto/syntax";
import type {
  $Typed,
  AppBskyActorDefs,
  AppBskyFeedDefs,
} from "@repo/client/server";
import type { Post, Record } from "@repo/common/domain";
import { required } from "@repo/common/utils";

import type { IPostRepository } from "../interfaces/post-repository.js";
import type {
  IPostStatsRepository,
  PostStats,
} from "../interfaces/post-stats-repository.js";
import type { IRecordRepository } from "../interfaces/record-repository.js";
import type { EmbedViewService } from "./embed-view-service.js";
import type { ProfileViewService } from "./profile-view-service.js";

export class PostViewService {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly recordRepository: IRecordRepository,
    private readonly postStatsRepository: IPostStatsRepository,
    private readonly profileViewService: ProfileViewService,
    private readonly embedViewService: EmbedViewService,
  ) {}
  static inject = [
    "postRepository",
    "recordRepository",
    "postStatsRepository",
    "profileViewService",
    "embedViewService",
  ] as const;

  // TODO: 引数をPost[]にした方がいい？
  async findPostView(
    uris: AtUri[],
  ): Promise<$Typed<AppBskyFeedDefs.PostView>[]> {
    if (uris.length === 0) {
      return [];
    }

    const posts = await this.postRepository.findByUris(uris);
    const records = await this.recordRepository.findMany(uris);

    const postUris = posts.map((post) => post.uri.toString());
    const authorDids = [...new Set(posts.map((post) => post.actorDid))];

    const [authors, statsMap] = await Promise.all([
      this.profileViewService.findProfileViewBasic(authorDids),
      this.postStatsRepository.findStats(postUris),
    ]);

    const postMap = new Map(posts.map((post) => [post.uri.toString(), post]));
    const authorMap = new Map(authors.map((author) => [author.did, author]));
    const recordMap = new Map(
      records.map((record) => [record.uri.toString(), record]),
    );

    return uris
      .map((uri) => {
        const post = postMap.get(uri.toString());
        if (!post) return null;

        const author = authorMap.get(post.actorDid);
        const record = recordMap.get(post.uri.toString());
        const stats = statsMap.get(post.uri.toString());
        if (!author || !record || !stats) {
          throw new Error(
            `Missing author, record, or stats for post: ${post.uri.toString()}`,
          );
        }

        return this.createPostView(post, record, author, stats);
      })
      .filter((postView) => postView !== null);
  }

  private isRecordObject(value: unknown): value is { [x: string]: unknown } {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private createPostView(
    post: Post,
    record: Record,
    author: AppBskyActorDefs.ProfileViewBasic,
    stats: PostStats,
  ): $Typed<AppBskyFeedDefs.PostView> {
    if (!this.isRecordObject(record.json)) {
      throw new Error(`Invalid record json for post: ${post.uri.toString()}`);
    }

    return {
      $type: "app.bsky.feed.defs#postView",
      uri: post.uri.toString(),
      cid: post.cid,
      author,
      record: record.json,
      embed: this.embedViewService.toView(post.embed, post.actorDid),
      replyCount: stats.replyCount,
      repostCount: stats.repostCount,
      likeCount: stats.likeCount,
      quoteCount: stats.quoteCount,
      indexedAt: required(post.indexedAt).toISOString(),
    };
  }
}
