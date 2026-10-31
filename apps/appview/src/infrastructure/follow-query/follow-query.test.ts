import { asDid } from "@atproto/did";
import {
  actorFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { FollowQuery } from "./follow-query.js";

describe("FollowQuery", () => {
  const { ctx } = testSetup;

  const followQuery = new FollowQuery(ctx.db);

  describe("findFollows", () => {
    test("actorDidsとsubjectDidsの両方に当てはまるフォローだけを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const target = await actorFactory(ctx.db).create();
      const other = await actorFactory(ctx.db).create();
      const createFollow = (from: typeof actor, to: typeof actor) =>
        followFactory(ctx.db)
          .vars({
            record: () =>
              recordFactory(ctx.db, "app.bsky.graph.follow")
                .vars({ actor: () => from })
                .create(),
            followee: () => to,
          })
          .create();
      const follow = await createFollow(actor, target);
      await createFollow(actor, other);
      await createFollow(target, actor);

      // act
      const result = await followQuery.findFollows({
        actorDids: [asDid(actor.did)],
        subjectDids: [asDid(target.did)],
      });

      // assert
      expect(result).toEqual([
        {
          uri: follow.uri,
          actorDid: actor.did,
          subjectDid: target.did,
        },
      ]);
    });
  });
});
