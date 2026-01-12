import type { Did } from "@atproto/did";
import type { Follow } from "@repo/common/domain";

import type { IFollowRepository } from "../../interfaces/follow-repository.js";
import { createCursorPaginator, type Page } from "../../utils/pagination.js";

export class FollowService {
  constructor(private readonly followRepository: IFollowRepository) {}
  static inject = ["followRepository"] as const;

  async findFollowsWithPagination({
    actorDid,
    cursor,
    limit,
  }: {
    actorDid: Did;
    cursor?: string;
    limit: number;
  }): Promise<Page<Follow>> {
    const paginator = createCursorPaginator<Follow>({
      limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });

    const follows = await this.followRepository.findFollows({
      actorDid,
      limit: paginator.queryLimit,
      cursor,
    });

    return paginator.extractPage(follows);
  }

  async findFollowersWithPagination({
    actorDid,
    cursor,
    limit,
  }: {
    actorDid: Did;
    cursor?: string;
    limit: number;
  }): Promise<Page<Follow>> {
    const paginator = createCursorPaginator<Follow>({
      limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });

    const followers = await this.followRepository.findFollowers({
      actorDid,
      limit: paginator.queryLimit,
      cursor,
    });

    return paginator.extractPage(followers);
  }
}
