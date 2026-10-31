import type { Did } from "@atproto/did";

import type { FollowDto } from "../../application/dto/follow-dto.js";
import type { IFollowQuery } from "../../application/interfaces/follow-query.js";

export class InMemoryFollowQuery implements IFollowQuery {
  private follows: FollowDto[] = [];

  add(follow: FollowDto): void {
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
      this.follows.filter(
        (follow) =>
          params.actorDids.includes(follow.actorDid) &&
          params.subjectDids.includes(follow.subjectDid),
      ),
    );
  }
}
