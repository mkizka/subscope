import type { Did } from "@atproto/did";
import type { Follow } from "@repo/common/domain";

import type { FollowDto } from "../../application/dto/follow-dto.js";
import type { IFollowQuery } from "../../application/interfaces/follow-query.js";

export class InMemoryFollowQuery implements IFollowQuery {
  private follows: Follow[] = [];

  add(follow: Follow): void {
    this.follows.push(follow);
  }

  clear(): void {
    this.follows = [];
  }

  findFollows(params: {
    actorDids: Did[];
    subjectDids: Did[];
  }): Promise<FollowDto[]> {
    return Promise.resolve(
      this.follows
        .filter(
          (follow) =>
            params.actorDids.includes(follow.actorDid) &&
            params.subjectDids.includes(follow.subjectDid),
        )
        .map((follow) => ({
          uri: follow.uri.toString(),
          actorDid: follow.actorDid,
          subjectDid: follow.subjectDid,
        })),
    );
  }

  findActorFollows(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<Follow[]> {
    return this.findPage(
      (follow) => follow.actorDid === params.actorDid,
      params,
    );
  }

  findActorFollowers(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<Follow[]> {
    return this.findPage(
      (follow) => follow.subjectDid === params.actorDid,
      params,
    );
  }

  findFolloweeDids(actorDid: Did): Promise<Did[]> {
    return Promise.resolve(
      this.follows
        .filter((follow) => follow.actorDid === actorDid)
        .map((follow) => follow.subjectDid),
    );
  }

  private findPage(
    filter: (follow: Follow) => boolean,
    params: { limit: number; cursor?: string },
  ): Promise<Follow[]> {
    const cursor = params.cursor ? new Date(params.cursor) : undefined;
    return Promise.resolve(
      this.follows
        .filter(filter)
        .filter((follow) => !cursor || follow.sortAt < cursor)
        .sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime())
        .slice(0, params.limit),
    );
  }
}
