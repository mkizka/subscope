import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type {
  $Typed,
  AppBskyActorDefs,
  AppBskyFeedDefs,
} from "@repo/client/server";
import type { ILoggerManager, Logger, Post, Record } from "@repo/common/domain";
import { PostEmbedRecord } from "@repo/common/domain";
import { required } from "@repo/common/utils";

import type { IPostRepository } from "../interfaces/post-repository.js";
import type {
  IPostStatsRepository,
  PostStats,
} from "../interfaces/post-stats-repository.js";
import type { IRecordRepository } from "../interfaces/record-repository.js";
import type { EmbedViewService } from "./embed-view-service.js";
import type { ProfileViewService } from "./profile-view-service.js";

type PostView = $Typed<AppBskyFeedDefs.PostView>;
type PostViewMap = Map<string, PostView>;
type ProfileViewBasic = $Typed<AppBskyActorDefs.ProfileViewBasic>;

interface PostDataMaps {
  postMap: Map<string, Post>;
  recordMap: Map<string, Record>;
  authorMap: Map<string, ProfileViewBasic>;
  statsMap: Map<string, PostStats>;
}

export class PostViewService {
  private readonly logger: Logger;

  constructor(
    private readonly postRepository: IPostRepository,
    private readonly recordRepository: IRecordRepository,
    private readonly postStatsRepository: IPostStatsRepository,
    private readonly profileViewService: ProfileViewService,
    private readonly embedViewService: EmbedViewService,
    loggerManager: ILoggerManager,
  ) {
    this.logger = loggerManager.createLogger("PostViewService");
  }
  static inject = [
    "postRepository",
    "recordRepository",
    "postStatsRepository",
    "profileViewService",
    "embedViewService",
    "loggerManager",
  ] as const;

  async findPostView(uris: AtUri[]): Promise<PostView[]> {
    if (uris.length === 0) {
      return [];
    }

    const posts = await this.postRepository.findByUris(uris);
    const embedUris = this.extractEmbedUris(posts);

    if (embedUris.length === 0) {
      return this.hydratePostViews(uris, posts);
    }

    return this.hydratePostViewsWithEmbeds(uris, posts, embedUris);
  }

  private async hydratePostViewsWithEmbeds(
    uris: AtUri[],
    posts: Post[],
    embedUris: AtUri[],
  ): Promise<PostView[]> {
    const embedPosts = await this.postRepository.findByUris(embedUris);
    const embedPostViews = await this.hydratePostViews(embedUris, embedPosts);
    const embedPostViewMap = new Map<string, PostView>(
      embedPostViews.map((view) => [view.uri, view]),
    );

    return this.hydratePostViews(uris, posts, embedPostViewMap);
  }

  private extractEmbedUris(posts: Post[]): AtUri[] {
    return posts
      .map((post) => post.embed)
      .filter((embed) => embed instanceof PostEmbedRecord)
      .map((embed) => embed.uri);
  }

  private async hydratePostViews(
    uris: AtUri[],
    providedPosts: Post[],
    embedPostViewMap?: PostViewMap,
  ): Promise<PostView[]> {
    if (uris.length === 0) {
      return [];
    }

    const postData = await this.fetchPostData(uris, providedPosts);
    const dataMaps = this.createDataMaps(postData);

    return uris
      .map((uri) => this.tryCreatePostView(uri, dataMaps, embedPostViewMap))
      .filter((postView) => postView !== null);
  }

  private async fetchPostData(uris: AtUri[], providedPosts: Post[]) {
    const records = await this.recordRepository.findMany(uris);
    const postUris = providedPosts.map((post) => post.uri.toString());
    const authorDids = this.extractUniqueAuthorDids(providedPosts);

    const [authors, stats] = await Promise.all([
      this.profileViewService.findProfileViewBasic(authorDids),
      this.postStatsRepository.findStats(postUris),
    ]);

    return { posts: providedPosts, records, authors, stats };
  }

  private extractUniqueAuthorDids(posts: Post[]): Did[] {
    return [...new Set(posts.map((post) => post.actorDid))];
  }

  private createDataMaps(postData: {
    posts: Post[];
    records: Record[];
    authors: ProfileViewBasic[];
    stats: Map<string, PostStats>;
  }): PostDataMaps {
    const { posts, records, authors, stats } = postData;
    return {
      postMap: new Map(posts.map((post) => [post.uri.toString(), post])),
      recordMap: new Map(
        records.map((record) => [record.uri.toString(), record]),
      ),
      authorMap: new Map(authors.map((author) => [author.did, author])),
      statsMap: stats,
    };
  }

  private tryCreatePostView(
    uri: AtUri,
    dataMaps: PostDataMaps,
    embedPostViewMap?: PostViewMap,
  ): PostView | null {
    const uriString = uri.toString();
    const post = dataMaps.postMap.get(uriString);
    if (!post) return null;

    const requiredData = this.getRequiredPostData(post, uriString, dataMaps);
    if (!requiredData) {
      return null;
    }

    return this.createPostView(
      post,
      requiredData.record,
      requiredData.author,
      requiredData.stats,
      embedPostViewMap,
    );
  }

  private getRequiredPostData(
    post: Post,
    uriString: string,
    dataMaps: PostDataMaps,
  ) {
    const author = dataMaps.authorMap.get(post.actorDid);
    const record = dataMaps.recordMap.get(uriString);
    const stats = dataMaps.statsMap.get(uriString);

    if (!author || !record || !stats) {
      this.logger.warn(
        { author, record, stats },
        `Missing data for post ${uriString}`,
      );
      return null;
    }

    return { author, record, stats };
  }

  private isRecordObject(value: unknown): value is { [x: string]: unknown } {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private createPostView(
    post: Post,
    record: Record,
    author: ProfileViewBasic,
    stats: PostStats,
    embedPostViewMap?: PostViewMap,
  ): PostView {
    if (!this.isRecordObject(record.json)) {
      throw new Error(`Invalid record json for post: ${post.uri.toString()}`);
    }

    return {
      $type: "app.bsky.feed.defs#postView",
      uri: post.uri.toString(),
      cid: post.cid,
      author,
      record: record.json,
      embed: this.embedViewService.toView(
        post.embed,
        post.actorDid,
        embedPostViewMap,
      ),
      replyCount: stats.replyCount,
      repostCount: stats.repostCount,
      likeCount: stats.likeCount,
      quoteCount: stats.quoteCount,
      indexedAt: required(post.indexedAt).toISOString(),
    };
  }
}
