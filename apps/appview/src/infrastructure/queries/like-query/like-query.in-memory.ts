import type { Did } from "@atproto/did";
import { asAtUriString, type AtUri } from "@atproto/syntax";
import type { Like } from "@repo/common/domain";

import type { FeedItemDto } from "../../../application/dto/feed-item-dto.js";
import type {
  LikeDto,
  SubjectLikeDto,
} from "../../../application/dto/like-dto.js";
import type { ILikeQuery } from "../../../application/interfaces/queries/like-query.js";

export class InMemoryLikeQuery implements ILikeQuery {
  private likes: Like[] = [];

  add(like: Like): void {
    this.likes.push(like);
  }

  findViewerLikes({
    viewerDid,
    subjectUris,
  }: {
    viewerDid: Did;
    subjectUris: AtUri[];
  }): Promise<LikeDto[]> {
    const uris = subjectUris.map((uri) => uri.toString());
    return Promise.resolve(
      this.likes
        .filter(
          (like) =>
            like.actorDid === viewerDid &&
            uris.includes(like.subjectUri.toString()),
        )
        .map((like) => ({
          uri: asAtUriString(like.uri.toString()),
          subjectUri: asAtUriString(like.subjectUri.toString()),
        })),
    );
  }

  findActorLikeFeedItems(): Promise<FeedItemDto[]> {
    throw new Error("Not implemented");
  }

  findSubjectLikes({
    subjectUri,
    limit,
    cursor,
  }: {
    subjectUri: string;
    limit: number;
    cursor?: Date;
  }): Promise<SubjectLikeDto[]> {
    return Promise.resolve(
      this.likes
        .filter(
          (like) =>
            like.subjectUri.toString() === subjectUri &&
            (!cursor || like.sortAt < cursor),
        )
        .sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime())
        .slice(0, limit)
        .map(({ actorDid, createdAt, sortAt }) => ({
          actorDid,
          createdAt,
          sortAt,
        })),
    );
  }
}
