import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import type { ActorStatsDto } from "../dto/actor-stats-dto.js";
import type { FollowDto } from "../dto/follow-dto.js";
import type { GeneratorDto } from "../dto/generator-dto.js";
import type { LabelDto } from "../dto/label-dto.js";
import type { LikeDto } from "../dto/like-dto.js";
import type { ListItemDto } from "../dto/list-item-dto.js";
import type { PostDto } from "../dto/post-dto.js";
import type { PostStatsDto } from "../dto/post-stats-dto.js";
import type { ProfileDto } from "../dto/profile-dto.js";
import type { RecordDto } from "../dto/record-dto.js";
import type { RepostDto } from "../dto/repost-dto.js";
import type { IActorStatsQuery } from "../interfaces/actor-stats-query.js";
import type { IFollowQuery } from "../interfaces/follow-query.js";
import type { IGeneratorQuery } from "../interfaces/generator-query.js";
import { type ILabelQuery, isTakendown } from "../interfaces/label-query.js";
import type { ILikeQuery } from "../interfaces/like-query.js";
import type { IListItemQuery } from "../interfaces/list-item-query.js";
import type { IPostQuery } from "../interfaces/post-query.js";
import type { IPostStatsQuery } from "../interfaces/post-stats-query.js";
import type { IProfileQuery } from "../interfaces/profile-query.js";
import type { IRecordQuery } from "../interfaces/record-query.js";
import type { IRepostQuery } from "../interfaces/repost-query.js";
import { hiddenReason } from "../visibility/visibility-filter.js";
import { Batch } from "./batch.js";

export type Viewer = {
  viewerDid?: Did | null;
  includeTakedowns?: boolean;
  labelerDids?: string[];
};

type Repositories = {
  profileQuery: IProfileQuery;
  labelQuery: ILabelQuery;
  followQuery: IFollowQuery;
  postQuery: IPostQuery;
  recordQuery: IRecordQuery;
  postStatsQuery: IPostStatsQuery;
  likeQuery: ILikeQuery;
  repostQuery: IRepostQuery;
  generatorQuery: IGeneratorQuery;
  actorStatsQuery: IActorStatsQuery;
  listItemQuery: IListItemQuery;
};

const toAtUris = (uris: string[]) => uris.map((uri) => new AtUri(uri));

export class ViewContext {
  private readonly profiles: Batch<Did, ProfileDto>;
  private readonly labels: Batch<string, LabelDto[]>;
  private readonly following: Batch<Did, FollowDto>;
  private readonly followedBy: Batch<Did, FollowDto>;
  private readonly posts: Batch<string, PostDto>;
  private readonly records: Batch<string, RecordDto>;
  private readonly postStats: Batch<string, PostStatsDto>;
  private readonly viewerLikes: Batch<string, LikeDto>;
  private readonly viewerReposts: Batch<string, RepostDto>;
  private readonly generators: Batch<string, GeneratorDto>;
  private readonly actorStatsBatch: Batch<Did, ActorStatsDto>;
  private readonly viewerListItems: Batch<string, ListItemDto>;

  constructor(
    repos: Repositories,
    readonly viewer: Viewer,
  ) {
    const viewerDid = viewer.viewerDid;
    const none = () => Promise.resolve([]);
    this.profiles = Batch.one(
      (dids) => repos.profileQuery.findByDids(dids),
      (profile) => profile.actorDid,
    );
    this.labels = Batch.many(
      (subjects) => repos.labelQuery.findBySubjects(subjects),
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
    this.viewerReposts = Batch.one(
      viewerDid
        ? (subjectUris) =>
            repos.repostQuery.findViewerReposts({
              viewerDid,
              subjectUris: toAtUris(subjectUris),
            })
        : none,
      (repost) => repost.subjectUri,
    );
    this.generators = Batch.one(
      (uris) => repos.generatorQuery.findByUris(toAtUris(uris)),
      (generator) => generator.uri,
    );
    this.actorStatsBatch = Batch.one(
      (dids) => repos.actorStatsQuery.findStats(dids),
      (stats) => stats.actorDid,
    );
    this.viewerListItems = Batch.one(
      viewerDid
        ? (listUris) =>
            repos.listItemQuery.findItems({ listUris, subjectDid: viewerDid })
        : none,
      (item) => item.listUri,
    );
  }

  private async isVisible(subject: string) {
    if (this.viewer.includeTakedowns) {
      return true;
    }
    return !isTakendown(await this.labels.load(subject));
  }

  async profile(did: Did) {
    const [profile, reason] = await Promise.all([
      this.profiles.load(did),
      this.hiddenReason(did),
    ]);
    if (!profile || this.viewer.includeTakedowns) {
      return profile;
    }
    return reason ? undefined : profile;
  }

  async hiddenReason(did: Did) {
    const [profile, labels] = await Promise.all([
      this.profiles.load(did),
      this.labels.load(did),
    ]);
    return profile && hiddenReason(profile, labels);
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

  async labelsOf(subject: string) {
    const labels = await this.labels.load(subject);
    const { labelerDids } = this.viewer;
    return labelerDids
      ? labels?.filter((label) => labelerDids.includes(label.src))
      : labels;
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

  actorStats(did: Did) {
    return this.actorStatsBatch.load(did);
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

  viewerListItem(listUri: string) {
    return this.viewerListItems.load(listUri);
  }
}

export class ViewContextFactory {
  private readonly repos: Repositories;

  constructor(
    profileQuery: IProfileQuery,
    labelQuery: ILabelQuery,
    followQuery: IFollowQuery,
    postQuery: IPostQuery,
    recordQuery: IRecordQuery,
    postStatsQuery: IPostStatsQuery,
    likeQuery: ILikeQuery,
    repostQuery: IRepostQuery,
    generatorQuery: IGeneratorQuery,
    actorStatsQuery: IActorStatsQuery,
    listItemQuery: IListItemQuery,
  ) {
    this.repos = {
      profileQuery,
      labelQuery,
      followQuery,
      postQuery,
      recordQuery,
      postStatsQuery,
      likeQuery,
      repostQuery,
      generatorQuery,
      actorStatsQuery,
      listItemQuery,
    };
  }

  create(viewer: Viewer = {}) {
    return new ViewContext(this.repos, viewer);
  }
}
