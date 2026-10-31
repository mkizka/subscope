import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { ProfileDetailed, Repost } from "@repo/common/domain";

import type { FollowDto } from "../dto/follow-dto.js";
import type { GeneratorDto } from "../dto/generator-dto.js";
import type { LikeDto } from "../dto/like-dto.js";
import type { PostDto } from "../dto/post-dto.js";
import type { PostStatsDto } from "../dto/post-stats-dto.js";
import type { RecordDto } from "../dto/record-dto.js";
import type { IFollowQuery } from "../interfaces/follow-query.js";
import type { IGeneratorQuery } from "../interfaces/generator-query.js";
import {
  type ILabelRepository,
  isTakendown,
  type Label,
} from "../interfaces/label-repository.js";
import type { ILikeQuery } from "../interfaces/like-query.js";
import type { IPostQuery } from "../interfaces/post-query.js";
import type { IPostStatsQuery } from "../interfaces/post-stats-query.js";
import type { IProfileRepository } from "../interfaces/profile-repository.js";
import type { IRecordQuery } from "../interfaces/record-query.js";
import type { IRepostRepository } from "../interfaces/repost-repository.js";
import { hiddenReason } from "../visibility/visibility-filter.js";
import { Batch } from "./batch.js";

export type Viewer = {
  viewerDid?: Did | null;
  includeTakedowns?: boolean;
};

type Repositories = {
  profileRepository: IProfileRepository;
  labelRepository: ILabelRepository;
  followQuery: IFollowQuery;
  postQuery: IPostQuery;
  recordQuery: IRecordQuery;
  postStatsQuery: IPostStatsQuery;
  likeQuery: ILikeQuery;
  repostRepository: IRepostRepository;
  generatorQuery: IGeneratorQuery;
};

const toAtUris = (uris: string[]) => uris.map((uri) => new AtUri(uri));
const bySubjectUri = (record: { subjectUri: AtUri }) =>
  record.subjectUri.toString();

export class ViewContext {
  private readonly profiles: Batch<Did, ProfileDetailed>;
  private readonly labels: Batch<string, Label[]>;
  private readonly following: Batch<Did, FollowDto>;
  private readonly followedBy: Batch<Did, FollowDto>;
  private readonly posts: Batch<string, PostDto>;
  private readonly records: Batch<string, RecordDto>;
  private readonly postStats: Batch<string, PostStatsDto>;
  private readonly viewerLikes: Batch<string, LikeDto>;
  private readonly viewerReposts: Batch<string, Repost>;
  private readonly generators: Batch<string, GeneratorDto>;

  constructor(
    repos: Repositories,
    readonly viewer: Viewer,
  ) {
    const viewerDid = viewer.viewerDid;
    const none = () => Promise.resolve([]);
    this.profiles = Batch.one(
      (dids) => repos.profileRepository.findManyDetailed(dids),
      (profile) => profile.actorDid,
    );
    this.labels = Batch.many(
      (subjects) => repos.labelRepository.findBySubjects(subjects),
      (label) => label.uri,
    );
    this.following = Batch.one(
      viewerDid
        ? (subjectDids) =>
            repos.followQuery.findFollows({
              actorDids: [viewerDid],
              subjectDids,
            })
        : none,
      (follow) => follow.subjectDid,
    );
    this.followedBy = Batch.one(
      viewerDid
        ? (actorDids) =>
            repos.followQuery.findFollows({
              actorDids,
              subjectDids: [viewerDid],
            })
        : none,
      (follow) => follow.actorDid,
    );
    this.posts = Batch.one(
      (uris) => repos.postQuery.findByUris(toAtUris(uris)),
      (post) => post.uri,
    );
    this.records = Batch.one(
      (uris) => repos.recordQuery.findRecords(toAtUris(uris)),
      (record) => record.uri,
    );
    this.postStats = Batch.one(
      (uris) => repos.postStatsQuery.findStats(toAtUris(uris)),
      (stats) => stats.uri,
    );
    this.viewerLikes = Batch.one(
      viewerDid
        ? (subjectUris) =>
            repos.likeQuery.findViewerLikes({
              viewerDid,
              subjectUris: toAtUris(subjectUris),
            })
        : none,
      (like) => like.subjectUri,
    );
    this.viewerReposts = Batch.one<string, Repost>(
      viewerDid
        ? (subjectUris) =>
            repos.repostRepository.findViewerReposts({ viewerDid, subjectUris })
        : none,
      bySubjectUri,
    );
    this.generators = Batch.one(
      (uris) => repos.generatorQuery.findByUris(toAtUris(uris)),
      (generator) => generator.uri,
    );
  }

  private async isVisible(subject: string) {
    if (this.viewer.includeTakedowns) {
      return true;
    }
    return !isTakendown(await this.labels.load(subject));
  }

  async profile(did: Did) {
    const [profile, labels] = await Promise.all([
      this.profiles.load(did),
      this.labels.load(did),
    ]);
    if (!profile || this.viewer.includeTakedowns) {
      return profile;
    }
    return hiddenReason(profile, labels) ? undefined : profile;
  }

  async post(uri: string) {
    const [post, visible] = await Promise.all([
      this.posts.load(uri),
      this.isVisible(uri),
    ]);
    if (!post || !visible) {
      return undefined;
    }
    return (await this.profile(post.actorDid)) ? post : undefined;
  }

  record(uri: string) {
    return this.records.load(uri);
  }

  stats(uri: string) {
    return this.postStats.load(uri);
  }

  generator(uri: string) {
    return this.generators.load(uri);
  }

  async viewerState(did: Did) {
    const [following, followedBy] = await Promise.all([
      this.following.load(did),
      this.followedBy.load(did),
    ]);
    return { following: following?.uri, followedBy: followedBy?.uri };
  }

  async viewerPostState(uri: string) {
    const [like, repost] = await Promise.all([
      this.viewerLikes.load(uri),
      this.viewerReposts.load(uri),
    ]);
    return { like, repost };
  }
}

export class ViewContextFactory {
  private readonly repos: Repositories;

  constructor(
    profileRepository: IProfileRepository,
    labelRepository: ILabelRepository,
    followQuery: IFollowQuery,
    postQuery: IPostQuery,
    recordQuery: IRecordQuery,
    postStatsQuery: IPostStatsQuery,
    likeQuery: ILikeQuery,
    repostRepository: IRepostRepository,
    generatorQuery: IGeneratorQuery,
  ) {
    this.repos = {
      profileRepository,
      labelRepository,
      followQuery,
      postQuery,
      recordQuery,
      postStatsQuery,
      likeQuery,
      repostRepository,
      generatorQuery,
    };
  }

  create(viewer: Viewer = {}) {
    return new ViewContext(this.repos, viewer);
  }
}
