import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

import type { FeedItemDto } from "../dto/feed-item-dto.js";
import type { LikeDto, SubjectLikeDto } from "../dto/like-dto.js";

export interface ILikeQuery {
  findViewerLikes: (params: {
    viewerDid: Did;
    subjectUris: AtUri[];
  }) => Promise<LikeDto[]>;

  findActorLikeFeedItems: (params: {
    actorDid: Did;
    limit: number;
    cursor?: Date;
  }) => Promise<FeedItemDto[]>;

  findSubjectLikes: (params: {
    subjectUri: string;
    limit: number;
    cursor?: Date;
  }) => Promise<SubjectLikeDto[]>;
}
