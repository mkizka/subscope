import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type {
  Generator,
  Like,
  ProfileDetailed,
  Repost,
} from "@repo/common/domain";

import type { PostDto } from "../dto/post-dto.js";
import type { PostStatsDto } from "../dto/post-stats-dto.js";
import type { RecordDto } from "../dto/record-dto.js";
import type { IFollowRepository } from "../interfaces/follow-repository.js";
import type { IGeneratorRepository } from "../interfaces/generator-repository.js";
import {
  type ILabelRepository,
  isTakendown,
  type Label,
} from "../interfaces/label-repository.js";
import type { ILikeRepository } from "../interfaces/like-repository.js";
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
  followRepository: IFollowRepository;
  postQuery: IPostQuery;
  recordQuery: IRecordQuery;
  postStatsQuery: IPostStatsQuery;
  likeRepository: ILikeRepository;
  repostRepository: IRepostRepository;
  generatorRepository: IGeneratorRepository;
};

const toAtUris = (uris: string[]) => uris.map((uri) => new AtUri(uri));
const byUri = (record: { uri: AtUri }): string => record.uri.toString();
const bySubjectUri = (record: { subjectUri: AtUri }) =>
  record.subjectUri.toString();

export class ViewContext {
  private readonly profiles: Batch<Did, ProfileDetailed>;
  private readonly labels: Batch<string, Label[]>;
  private readonly following: Batch<Did, [Did, AtUri]>;
  private readonly followedBy: Batch<Did, [Did, AtUri]>;
  private readonly posts: Batch<string, PostDto>;
  private readonly records: Batch<string, RecordDto>;
  private readonly postStats: Batch<string, PostStatsDto>;
  private readonly viewerLikes: Batch<string, Like>;
  private readonly viewerReposts: Batch<string, Repost>;
  private readonly generators: Batch<string, Generator>;

  constructor(
    repos: Repositories,
    readonly viewer: Viewer,
  ) {
    const viewerDid = viewer.viewerDid;
    const none = () => Promise.resolve([]);
    const first = <K>([key]: [K, unknown]) => key;
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
        ? (targetDids) =>
            repos.followRepository
              .findFollowingMap({ actorDid: viewerDid, targetDids })
              .then((map) => [...map])
        : none,
      first,
    );
    this.followedBy = Batch.one(
      viewerDid
        ? (targetDids) =>
            repos.followRepository
              .findFollowedByMap({ actorDid: viewerDid, targetDids })
              .then((map) => [...map])
        : none,
      first,
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
    this.viewerLikes = Batch.one<string, Like>(
      viewerDid
        ? (subjectUris) =>
            repos.likeRepository.findViewerLikes({ viewerDid, subjectUris })
        : none,
      bySubjectUri,
    );
    this.viewerReposts = Batch.one<string, Repost>(
      viewerDid
        ? (subjectUris) =>
            repos.repostRepository.findViewerReposts({ viewerDid, subjectUris })
        : none,
      bySubjectUri,
    );
    this.generators = Batch.one(
      (uris) => repos.generatorRepository.findByUris(toAtUris(uris)),
      byUri,
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
    return { following: following?.[1], followedBy: followedBy?.[1] };
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
    followRepository: IFollowRepository,
    postQuery: IPostQuery,
    recordQuery: IRecordQuery,
    postStatsQuery: IPostStatsQuery,
    likeRepository: ILikeRepository,
    repostRepository: IRepostRepository,
    generatorRepository: IGeneratorRepository,
  ) {
    this.repos = {
      profileRepository,
      labelRepository,
      followRepository,
      postQuery,
      recordQuery,
      postStatsQuery,
      likeRepository,
      repostRepository,
      generatorRepository,
    };
  }

  create(viewer: Viewer = {}) {
    return new ViewContext(this.repos, viewer);
  }
}
