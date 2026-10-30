import { type $Typed, isPlainObject, type LexMap } from "@atproto/lex";
import { AtUri, toDatetimeString } from "@atproto/syntax";
import type * as AppBskyEmbedRecord from "@repo/client/lex/app/bsky/embed/record";
import type * as AppBskyFeedDefs from "@repo/client/lex/app/bsky/feed/defs";
import type { Post } from "@repo/common/domain";

import {
  toMapByDid,
  toMapBySubjectUri,
  toMapByUri,
} from "../../../application/utils/map.js";

function asLexMap(value: unknown): LexMap {
  if (isPlainObject(value)) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return value as LexMap;
  }
  throw new Error("Value is not an object");
}

import type { Did } from "@atproto/did";

import {
  type ILabelRepository,
  isTakendown,
} from "../../../application/interfaces/label-repository.js";
import type { ILikeRepository } from "../../../application/interfaces/like-repository.js";
import type { IPostRepository } from "../../../application/interfaces/post-repository.js";
import type { IPostStatsRepository } from "../../../application/interfaces/post-stats-repository.js";
import type { IRecordRepository } from "../../../application/interfaces/record-repository.js";
import type { IRepostRepository } from "../../../application/interfaces/repost-repository.js";
import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";
import type { GeneratorViewService } from "./generator-view-service.js";
import type { PostEmbedViewBuilder } from "./post-embed-view-builder.js";

export class PostViewService {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly postStatsRepository: IPostStatsRepository,
    private readonly recordRepository: IRecordRepository,
    private readonly profileViewService: ProfileViewService,
    private readonly generatorViewService: GeneratorViewService,
    private readonly postEmbedViewBuilder: PostEmbedViewBuilder,
    private readonly repostRepository: IRepostRepository,
    private readonly likeRepository: ILikeRepository,
    private readonly labelRepository: ILabelRepository,
  ) {}

  private async findPosts(uris: AtUri[]) {
    const [posts, labels] = await Promise.all([
      this.postRepository.findByUris(uris),
      this.labelRepository.findBySubjects(uris.map((uri) => uri.toString())),
    ]);
    const labelMap = Map.groupBy(labels, (label) => label.uri);
    return posts.filter(
      (post) => !isTakendown(labelMap.get(post.uri.toString())),
    );
  }

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

    const posts = await this.findPosts(postUris);

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
        value: asLexMap(record.json),
        replyCount: stats?.replyCount ?? 0,
        repostCount: stats?.repostCount ?? 0,
        likeCount: stats?.likeCount ?? 0,
        quoteCount: stats?.quoteCount ?? 0,
        embeds,
        indexedAt: toDatetimeString(post.indexedAt),
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
    viewerDid?: Did,
  ): Promise<$Typed<AppBskyFeedDefs.PostView>[]> {
    const posts = await this.findPosts(uris);
    const postMap = toMapByUri(posts);

    const postUris = posts.map((post) => post.uri.toString());

    const [recordMap, profileMap, postStats, viewerRepostMap, viewerLikeMap] =
      await Promise.all([
        this.recordRepository
          .findByUris(posts.map((post) => post.uri))
          .then(toMapByUri),
        this.profileViewService
          .findProfileViewBasic(posts.map((post) => post.actorDid))
          .then(toMapByDid),
        this.postStatsRepository.findMap(posts.map((post) => post.uri)),
        viewerDid &&
          this.repostRepository
            // TODO: AtUriのまま渡せるようにする
            .findViewerReposts({ viewerDid, subjectUris: postUris })
            .then(toMapBySubjectUri),
        viewerDid &&
          this.likeRepository
            .findViewerLikes({ viewerDid, subjectUris: postUris })
            .then(toMapBySubjectUri),
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
          record: asLexMap(record.json),
          embed: this.postEmbedViewBuilder.embedView(post, embedMaps),
          replyCount: stats?.replyCount ?? 0,
          repostCount: stats?.repostCount ?? 0,
          likeCount: stats?.likeCount ?? 0,
          quoteCount: stats?.quoteCount ?? 0,
          viewer: {
            repost: viewerRepostMap?.get(post.uri.toString())?.uri.toString(),
            like: viewerLikeMap?.get(post.uri.toString())?.uri.toString(),
          },
          indexedAt: toDatetimeString(post.indexedAt),
        } as const;
      })
      .filter((postView) => postView !== null);
  }
}
