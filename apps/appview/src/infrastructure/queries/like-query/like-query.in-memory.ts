import type { Did } from "@atproto/did";
import type { AtUri, AtUriString } from "@atproto/syntax";

import type { FeedItemDto } from "../../../application/dto/feed-item-dto.js";
import type {
  LikeDto,
  SubjectLikeDto,
} from "../../../application/dto/like-dto.js";
import type { ILikeQuery } from "../../../application/interfaces/queries/like-query.js";

type Like = {
  uri: AtUriString;
  accountDid: Did;
  subjectUri: AtUriString;
  createdAt: Date;
  sortAt: Date;
};

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
            like.accountDid === viewerDid && uris.includes(like.subjectUri),
        )
        .map((like) => ({
          uri: like.uri,
          subjectUri: like.subjectUri,
        })),
    );
  }

  findAccountLikeFeedItems(): Promise<FeedItemDto[]> {
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
            like.subjectUri === subjectUri && (!cursor || like.sortAt < cursor),
        )
        .sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime())
        .slice(0, limit)
        .map(({ accountDid, createdAt, sortAt }) => ({
          accountDid,
          createdAt,
          sortAt,
        })),
    );
  }
}
