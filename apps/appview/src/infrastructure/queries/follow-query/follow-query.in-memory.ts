import type { Did } from "@atproto/did";
import type { Follow } from "@repo/common/domain";

import type {
  FollowDto,
  FolloweeDto,
  FollowerDto,
} from "../../../application/dto/follow-dto.js";
import type { IFollowQuery } from "../../../application/interfaces/queries/follow-query.js";

export class InMemoryFollowQuery implements IFollowQuery {
  private follows: Follow[] = [];

  add(follow: Follow): void {
    this.follows.push(follow);
  }

  clear(): void {
    this.follows = [];
  }

  findFollows(params: {
    accountDids: Did[];
    subjectDids: Did[];
  }): Promise<FollowDto[]> {
    return Promise.resolve(
      this.follows
        .filter(
          (follow) =>
            params.accountDids.includes(follow.accountDid) &&
            params.subjectDids.includes(follow.subjectDid),
        )
        .map((follow) => ({
          uri: follow.uri.toString(),
          accountDid: follow.accountDid,
          subjectDid: follow.subjectDid,
        })),
    );
  }

  findAccountFollows(params: {
    accountDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<FolloweeDto[]> {
    return Promise.resolve(
      this.findPage(
        (follow) => follow.accountDid === params.accountDid,
        params,
      ).map((follow) => ({
        subjectDid: follow.subjectDid,
        sortAt: follow.sortAt,
      })),
    );
  }

  findAccountFollowers(params: {
    accountDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<FollowerDto[]> {
    return Promise.resolve(
      this.findPage(
        (follow) => follow.subjectDid === params.accountDid,
        params,
      ).map((follow) => ({
        accountDid: follow.accountDid,
        sortAt: follow.sortAt,
      })),
    );
  }

  findFolloweeDids(accountDid: Did): Promise<Did[]> {
    return Promise.resolve(
      this.follows
        .filter((follow) => follow.accountDid === accountDid)
        .map((follow) => follow.subjectDid),
    );
  }

  private findPage(
    filter: (follow: Follow) => boolean,
    params: { limit: number; cursor?: string },
  ): Follow[] {
    const cursor = params.cursor ? new Date(params.cursor) : undefined;
    return this.follows
      .filter(filter)
      .filter((follow) => !cursor || follow.sortAt < cursor)
      .sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime())
      .slice(0, params.limit);
  }
}
