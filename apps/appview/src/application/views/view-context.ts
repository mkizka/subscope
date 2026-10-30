import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type {
  Generator,
  Like,
  Post,
  ProfileDetailed,
  Record,
  Repost,
} from "@repo/common/domain";

import type { PostStatsDto } from "../dto/post-stats-dto.js";
import type { IFollowRepository } from "../interfaces/follow-repository.js";
import type { IGeneratorRepository } from "../interfaces/generator-repository.js";
import {
  type ILabelRepository,
  isTakendown,
  type Label,
} from "../interfaces/label-repository.js";
import type { ILikeRepository } from "../interfaces/like-repository.js";
import type { IPostRepository } from "../interfaces/post-repository.js";
import type { IPostStatsQuery } from "../interfaces/post-stats-query.js";
import type { IProfileRepository } from "../interfaces/profile-repository.js";
import type { IRecordRepository } from "../interfaces/record-repository.js";
import type { IRepostRepository } from "../interfaces/repost-repository.js";
import { toMap, toMapBySubjectUri, toMapByUri } from "../utils/map.js";
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
  postRepository: IPostRepository;
  recordRepository: IRecordRepository;
  postStatsQuery: IPostStatsQuery;
  likeRepository: ILikeRepository;
  repostRepository: IRepostRepository;
  generatorRepository: IGeneratorRepository;
};

const toAtUris = (uris: string[]) => uris.map((uri) => new AtUri(uri));

export class ViewContext {
  private readonly profiles: Batch<Did, ProfileDetailed>;
  private readonly labels: Batch<string, Label[]>;
  private readonly following: Batch<Did, AtUri>;
  private readonly followedBy: Batch<Did, AtUri>;
  private readonly posts: Batch<string, Post>;
  private readonly records: Batch<string, Record>;
  private readonly postStats: Batch<string, PostStatsDto>;
  private readonly viewerLikes: Batch<string, Like>;
  private readonly viewerReposts: Batch<string, Repost>;
  private readonly generators: Batch<string, Generator>;

  constructor(
    repos: Repositories,
    readonly viewer: Viewer,
  ) {
    const viewerDid = viewer.viewerDid;
    const none = () => Promise.resolve(new Map());
    this.profiles = new Batch((dids) =>
      repos.profileRepository
        .findManyDetailed(dids)
        .then((profiles) => toMap(profiles, (profile) => profile.actorDid)),
    );
    this.labels = new Batch((subjects) =>
      repos.labelRepository
        .findBySubjects(subjects)
        .then((labels) => Map.groupBy(labels, (label) => label.uri)),
    );
    this.following = new Batch<Did, AtUri>(
      viewerDid
        ? (targetDids) =>
            repos.followRepository.findFollowingMap({
              actorDid: viewerDid,
              targetDids,
            })
        : none,
    );
    this.followedBy = new Batch<Did, AtUri>(
      viewerDid
        ? (targetDids) =>
            repos.followRepository.findFollowedByMap({
              actorDid: viewerDid,
              targetDids,
            })
        : none,
    );
    this.posts = new Batch((uris) =>
      repos.postRepository.findByUris(toAtUris(uris)).then(toMapByUri),
    );
    this.records = new Batch((uris) =>
      repos.recordRepository.findByUris(toAtUris(uris)).then(toMapByUri),
    );
    this.postStats = new Batch((uris) =>
      repos.postStatsQuery.findStats(toAtUris(uris)).then(toMapByUri),
    );
    this.viewerLikes = new Batch<string, Like>(
      viewerDid
        ? (subjectUris) =>
            repos.likeRepository
              .findViewerLikes({ viewerDid, subjectUris })
              .then(toMapBySubjectUri)
        : none,
    );
    this.viewerReposts = new Batch<string, Repost>(
      viewerDid
        ? (subjectUris) =>
            repos.repostRepository
              .findViewerReposts({ viewerDid, subjectUris })
              .then(toMapBySubjectUri)
        : none,
    );
    this.generators = new Batch((uris) =>
      repos.generatorRepository.findByUris(toAtUris(uris)).then(toMapByUri),
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
    return { following, followedBy };
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
    postRepository: IPostRepository,
    recordRepository: IRecordRepository,
    postStatsQuery: IPostStatsQuery,
    likeRepository: ILikeRepository,
    repostRepository: IRepostRepository,
    generatorRepository: IGeneratorRepository,
  ) {
    this.repos = {
      profileRepository,
      labelRepository,
      followRepository,
      postRepository,
      recordRepository,
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
