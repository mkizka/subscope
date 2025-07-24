import type { AtUri } from "@atproto/syntax";
import type {
  $Typed,
  AppBskyActorDefs,
  AppBskyEmbedRecord,
  AppBskyFeedDefs,
} from "@repo/client/server";
import type { Post, Record } from "@repo/common/domain";

import type { IPostRepository } from "../../interfaces/post-repository.js";
import type {
  IPostStatsRepository,
  PostStats,
} from "../../interfaces/post-stats-repository.js";
import type { IRecordRepository } from "../../interfaces/record-repository.js";
import { toMapByDid, toMapByUri } from "../../utils/map.js";
import type { ProfileViewService } from "../actor/profile-view-service.js";
import type { GeneratorViewService } from "./generator-view-service.js";
import type { PostEmbedViewBuilder } from "./post-embed-view-builder.js";

export class PostViewService {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly recordRepository: IRecordRepository,
    private readonly postStatsRepository: IPostStatsRepository,
    private readonly profileViewService: ProfileViewService,
    private readonly postEmbedViewBuilder: PostEmbedViewBuilder,
    private readonly generatorViewService: GeneratorViewService,
  ) {}
  static inject = [
    "postRepository",
    "recordRepository",
    "postStatsRepository",
    "profileViewService",
    "postEmbedViewBuilder",
    "generatorViewService",
  ] as const;

  async findPostView(
    uris: AtUri[],
  ): Promise<$Typed<AppBskyFeedDefs.PostView>[]> {
    if (uris.length === 0) {
      return [];
    }

    const found = await this.findPostsAndMaps(uris);
    if (!found) {
      return [];
    }

    const { postEmbedUris, generatorEmbedUris } = this.getEmbedUris(
      found.posts,
    );

    const [viewRecordMap, generatorViewMap] = await Promise.all([
      this.findEmbedViewRecordMap(postEmbedUris, { recursiveEmbed: true }),
      this.generatorViewService.findGeneratorViewMap(generatorEmbedUris),
    ]);

    return this.buildPostViews({
      ...found,
      embedMaps: { viewRecordMap, generatorViewMap },
    });
  }

  private async findPostsAndMaps(uris: AtUri[]) {
    const [posts, recordMap] = await Promise.all([
      this.postRepository.findByUris(uris),
      this.recordRepository.findByUris(uris).then(toMapByUri),
    ]);

    if (posts.length === 0) {
      return null;
    }

    const postUris = posts.map((post) => post.uri.toString());
    const authorDids = [...new Set(posts.map((post) => post.actorDid))];

    const [statsMap, profileMap] = await Promise.all([
      this.postStatsRepository.findMap(postUris),
      this.profileViewService.findProfileViewBasic(authorDids).then(toMapByDid),
    ]);

    return { posts, recordMap, statsMap, profileMap };
  }

  private getEmbedUris(posts: Post[]) {
    const embedUris = posts
      .map((post) => post.getEmbedRecordUri())
      .filter((uri) => uri !== null);
    const postEmbedUris = embedUris.filter(
      (uri) => uri.collection === "app.bsky.feed.post",
    );
    const generatorEmbedUris = embedUris.filter(
      (uri) => uri.collection === "app.bsky.feed.generator",
    );
    return { postEmbedUris, generatorEmbedUris };
  }

  private async findEmbedViewRecordMap(
    uris: AtUri[],
    options?: {
      recursiveEmbed: boolean;
    },
  ): Promise<Map<string, $Typed<AppBskyEmbedRecord.ViewRecord>>> {
    if (uris.length === 0) {
      return new Map();
    }

    const found = await this.findPostsAndMaps(uris);
    if (!found) {
      return new Map();
    }

    let embedMaps:
      | {
          viewRecordMap: Map<string, $Typed<AppBskyEmbedRecord.ViewRecord>>;
          generatorViewMap: Map<string, $Typed<AppBskyFeedDefs.GeneratorView>>;
        }
      | undefined;

    // 投稿 → 埋め込み投稿 → 埋め込み投稿 まで読み込む
    if (options?.recursiveEmbed) {
      const { postEmbedUris, generatorEmbedUris } = this.getEmbedUris(
        found.posts,
      );

      const [embedViewRecordMap, embedGeneratorViewMap] = await Promise.all([
        this.findEmbedViewRecordMap(postEmbedUris),
        this.generatorViewService.findGeneratorViewMap(generatorEmbedUris),
      ]);

      embedMaps = {
        viewRecordMap: embedViewRecordMap,
        generatorViewMap: embedGeneratorViewMap,
      };
    }

    const viewRecords = this.buildViewRecords({
      ...found,
      embedMaps,
    });

    return toMapByUri(viewRecords);
  }

  private isRecordObject(value: unknown): value is { [x: string]: unknown } {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private buildViewRecords({
    posts,
    recordMap,
    statsMap,
    profileMap,
    embedMaps,
  }: {
    posts: Post[];
    recordMap: Map<string, Record>;
    statsMap: Map<string, PostStats>;
    profileMap: Map<string, $Typed<AppBskyActorDefs.ProfileViewBasic>>;
    embedMaps?: {
      viewRecordMap: Map<string, $Typed<AppBskyEmbedRecord.ViewRecord>>;
      generatorViewMap: Map<string, $Typed<AppBskyFeedDefs.GeneratorView>>;
    };
  }): $Typed<AppBskyEmbedRecord.ViewRecord>[] {
    return posts
      .map((post) => {
        const record = recordMap.get(post.uri.toString());
        const author = profileMap.get(post.actorDid.toString());
        const stats = statsMap.get(post.uri.toString());

        if (!record || !author) {
          return null;
        }

        if (!this.isRecordObject(record.json)) {
          throw new Error(
            `Invalid record format for post ${post.uri.toString()}: ${JSON.stringify(record.json)}`,
          );
        }

        const viewRecord: $Typed<AppBskyEmbedRecord.ViewRecord> = {
          $type: "app.bsky.embed.record#viewRecord" as const,
          uri: post.uri.toString(),
          cid: record.cid,
          author,
          value: record.json,
          indexedAt: post.indexedAt.toISOString(),
          replyCount: stats?.replyCount,
          repostCount: stats?.repostCount,
          likeCount: stats?.likeCount,
          quoteCount: stats?.quoteCount,
        };

        if (post.embed && embedMaps) {
          const embedView = this.postEmbedViewBuilder.embedView(
            post.embed,
            post.actorDid.toString(),
            embedMaps,
          );
          if (embedView) {
            viewRecord.embeds = [embedView];
          }
        }

        return viewRecord;
      })
      .filter((viewRecord) => viewRecord !== null);
  }

  private buildPostViews({
    posts,
    recordMap,
    statsMap,
    profileMap,
    embedMaps,
  }: {
    posts: Post[];
    recordMap: Map<string, Record>;
    statsMap: Map<string, PostStats>;
    profileMap: Map<string, $Typed<AppBskyActorDefs.ProfileViewBasic>>;
    embedMaps?: {
      viewRecordMap: Map<string, $Typed<AppBskyEmbedRecord.ViewRecord>>;
      generatorViewMap: Map<string, $Typed<AppBskyFeedDefs.GeneratorView>>;
    };
  }): $Typed<AppBskyFeedDefs.PostView>[] {
    return posts
      .map((post) => {
        const record = recordMap.get(post.uri.toString());
        const author = profileMap.get(post.actorDid.toString());
        const stats = statsMap.get(post.uri.toString());

        if (!record || !author) {
          return null;
        }

        if (!this.isRecordObject(record.json)) {
          throw new Error(
            `Invalid record format for post ${post.uri.toString()}: ${JSON.stringify(record.json)}`,
          );
        }

        const postView: $Typed<AppBskyFeedDefs.PostView> = {
          $type: "app.bsky.feed.defs#postView" as const,
          uri: post.uri.toString(),
          cid: record.cid,
          author,
          record: record.json,
          replyCount: stats?.replyCount,
          repostCount: stats?.repostCount,
          likeCount: stats?.likeCount,
          quoteCount: stats?.quoteCount,
          indexedAt: post.indexedAt.toISOString(),
        };

        if (post.embed && embedMaps) {
          const embedView = this.postEmbedViewBuilder.embedView(
            post.embed,
            post.actorDid.toString(),
            embedMaps,
          );
          if (embedView) {
            postView.embed = embedView;
          }
        }
        return postView;
      })
      .filter((postView) => postView !== null);
  }
}
