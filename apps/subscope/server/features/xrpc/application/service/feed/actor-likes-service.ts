import type { Did } from "@atproto/did";
import { FeedItem } from "@repo/common/domain";

import type { ILikeRepository } from "../../interfaces/like-repository.js";
import { createCursorPaginator, type Page } from "../../utils/pagination.js";

export class ActorLikesService {
  constructor(private readonly likeRepository: ILikeRepository) {}
  static inject = ["likeRepository"] as const;

  async findLikesWithPagination({
    actorDid,
    cursor,
    limit,
  }: {
    actorDid: Did;
    cursor?: Date;
    limit: number;
  }): Promise<Page<FeedItem>> {
    const paginator = createCursorPaginator<FeedItem>({
      limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });

    const likes = await this.likeRepository.findLikesByActor({
      actorDid,
      limit: paginator.queryLimit,
      cursor: cursor?.toISOString(),
    });

    const feedItems: FeedItem[] = likes.map(
      (like) =>
        new FeedItem({
          uri: like.subjectUri.toString(),
          cid: like.subjectCid,
          type: "post",
          subjectUri: null,
          actorDid: like.actorDid,
          sortAt: like.sortAt,
        }),
    );

    return paginator.extractPage(feedItems);
  }
}
