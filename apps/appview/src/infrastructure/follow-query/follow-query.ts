import { asDid, type Did } from "@atproto/did";
import { asAtUriString } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, inArray } from "drizzle-orm";

import type { FollowDto } from "../../application/dto/follow-dto.js";
import type { IFollowQuery } from "../../application/interfaces/follow-query.js";

export class FollowQuery implements IFollowQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findFollows(params: {
    actorDids: Did[];
    subjectDids: Did[];
  }): Promise<FollowDto[]> {
    if (params.actorDids.length === 0 || params.subjectDids.length === 0) {
      return [];
    }
    const follows = await this.db.query.follows.findMany({
      where: and(
        inArray(schema.follows.actorDid, params.actorDids),
        inArray(schema.follows.subjectDid, params.subjectDids),
      ),
    });
    return follows.map((follow) => ({
      uri: asAtUriString(follow.uri),
      actorDid: asDid(follow.actorDid),
      subjectDid: asDid(follow.subjectDid),
    }));
  }
}
