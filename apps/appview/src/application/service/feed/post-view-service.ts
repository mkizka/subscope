import { AtUri } from "@atproto/syntax";
import type {
  $Typed,
  AppBskyEmbedRecord,
  AppBskyFeedDefs,
} from "@repo/client/server";
import type { Post } from "@repo/common/domain";

import { toMapByDid, toMapByUri } from "../../utils/map.js";

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asObject(value: unknown): Record<string, unknown> {
  if (isObject(value)) {
    return value;
  }
  throw new Error("Value is not an object");
}

import type { PostRepository } from "../../../infrastructure/post-repository.js";
import type { PostStatsRepository } from "../../../infrastructure/post-stats-repository.js";
import type { RecordRepository } from "../../../infrastructure/record-repository.js";
import type { ProfileViewService } from "../actor/profile-view-service.js";
import type { GeneratorViewService } from "./generator-view-service.js";
import type { PostEmbedViewBuilder } from "./post-embed-view-builder.js";

export class PostViewService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly postStatsRepository: PostStatsRepository,
    private readonly recordRepository: RecordRepository,
    private readonly profileViewService: ProfileViewService,
    private readonly generatorViewService: GeneratorViewService,
    private readonly postEmbedViewBuilder: PostEmbedViewBuilder,
  ) {}
  static readonly inject = [
    "postRepository",
    "postStatsRepository",
    "recordRepository",
    "profileViewService",
    "generatorViewService",
    "postEmbedViewBuilder",
  ] as const;

  private getEmbedRecordUris(posts: Post[]): AtUri[] {
    const embedRecordUris = new Set<string>();
    for (const post of posts) {
      const uri = post.getEmbedRecordUri();
      if (uri) {
        embedRecordUris.add(uri.toString());
      }
    }
    return Array.from(embedRecordUris).map((uri) => new AtUri(uri));
  }

  private async findGeneratorViewMap(
    uris: AtUri[],
  ): Promise<Map<string, $Typed<AppBskyFeedDefs.GeneratorView>>> {
    const generatorUris = uris.filter(
      (uri) => uri.collection === "app.bsky.feed.generator",
    );
    if (generatorUris.length === 0) {
      return new Map<string, $Typed<AppBskyFeedDefs.GeneratorView>>();
    }
    return await this.generatorViewService.findGeneratorViewMap(generatorUris);
  }

  private async findViewRecordMap(
    embedUris: AtUri[],
    maxDepth: number,
  ): Promise<Map<string, $Typed<AppBskyEmbedRecord.ViewRecord>>> {
    const viewRecordMap = new Map<
      string,
      $Typed<AppBskyEmbedRecord.ViewRecord>
    >();

    if (maxDepth <= 0) {
      return viewRecordMap;
    }

    const postUris = embedUris.filter(
      (uri) => uri.collection === "app.bsky.feed.post",
    );
    if (postUris.length === 0) {
      return viewRecordMap;
    }

    const posts = await this.postRepository.findByUris(postUris);

    const [recordMap, profileMap, postStats] = await Promise.all([
      this.recordRepository
        .findByUris(posts.map((post) => post.uri))
        .then(toMapByUri),
      this.profileViewService
        .findProfileViewBasic(posts.map((post) => post.actorDid))
        .then(toMapByDid),
      this.postStatsRepository.findMap(posts.map((post) => post.uri)),
    ]);

    const deepEmbedMaps = await this.findEmbedMaps(
      this.getEmbedRecordUris(posts),
      maxDepth - 1,
    );

    for (const post of posts) {
      const record = recordMap.get(post.uri.toString());
      const profile = profileMap.get(post.actorDid);
      const stats = postStats.get(post.uri.toString());
      if (!record || !profile) continue;

      // なんでここ配列なんだっけ
      const embeds = [
        this.postEmbedViewBuilder.embedView(post, deepEmbedMaps),
      ].filter((embed) => !!embed);

      const viewRecord: $Typed<AppBskyEmbedRecord.ViewRecord> = {
        $type: "app.bsky.embed.record#viewRecord",
        uri: post.uri.toString(),
        cid: record.cid,
        author: profile,
        value: asObject(record.json),
        replyCount: stats?.replyCount ?? 0,
        repostCount: stats?.repostCount ?? 0,
        likeCount: stats?.likeCount ?? 0,
        quoteCount: stats?.quoteCount ?? 0,
        embeds,
        indexedAt: post.indexedAt.toISOString(),
      };

      viewRecordMap.set(post.uri.toString(), viewRecord);
    }

    return viewRecordMap;
  }

  private async findEmbedMaps(
    embedUris: AtUri[],
    maxDepth: number,
  ): Promise<{
    viewRecordMap: Map<string, $Typed<AppBskyEmbedRecord.ViewRecord>>;
    generatorViewMap: Map<string, $Typed<AppBskyFeedDefs.GeneratorView>>;
  }> {
    const [viewRecordMap, generatorViewMap] = await Promise.all([
      this.findViewRecordMap(embedUris, maxDepth),
      this.findGeneratorViewMap(embedUris),
    ]);
    return { viewRecordMap, generatorViewMap };
  }

  async findPostView(
    uris: AtUri[],
  ): Promise<$Typed<AppBskyFeedDefs.PostView>[]> {
    const posts = await this.postRepository.findByUris(uris);
    const postMap = toMapByUri(posts);

    const [recordMap, profileMap, postStats] = await Promise.all([
      this.recordRepository
        .findByUris(posts.map((post) => post.uri))
        .then(toMapByUri),
      this.profileViewService
        .findProfileViewBasic(posts.map((post) => post.actorDid))
        .then(toMapByDid),
      this.postStatsRepository.findMap(posts.map((post) => post.uri)),
    ]);

    const embedMaps = await this.findEmbedMaps(
      this.getEmbedRecordUris(posts),
      2,
    );

    return uris
      .map((uri) => {
        const post = postMap.get(uri.toString());
        if (!post) return null;

        const record = recordMap.get(post.uri.toString());
        const profile = profileMap.get(post.actorDid);
        const stats = postStats.get(post.uri.toString());
        if (!record || !profile) return null;

        return {
          $type: "app.bsky.feed.defs#postView",
          uri: post.uri.toString(),
          cid: record.cid,
          author: profile,
          record: asObject(record.json),
          embed: this.postEmbedViewBuilder.embedView(post, embedMaps),
          replyCount: stats?.replyCount ?? 0,
          repostCount: stats?.repostCount ?? 0,
          likeCount: stats?.likeCount ?? 0,
          quoteCount: stats?.quoteCount ?? 0,
          indexedAt: post.indexedAt.toISOString(),
        } as const;
      })
      .filter((postView) => postView !== null);
  }
}
