import { beforeEach, describe, expect, test } from "vitest";

import { accountFactory } from "../../domain/account.factory.js";
import { testRegistry, type TestServices } from "../../shared/test-utils.js";
import { recordFactory } from "../dto/record.factory.js";

describe("TrackingPolicyService", () => {
  let trackingPolicyService: TestServices["trackingPolicyService"];
  let registrationQuery: TestServices["registrationQuery"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    trackingPolicyService = services.trackingPolicyService;
    registrationQuery = services.registrationQuery;
    db = services.db;
  });

  test.each([
    {
      name: "フォローした側がメンバーの場合、フォロー先を見直す対象にする",
      isMember: true,
      expected: true,
    },
    {
      name: "フォローした側がメンバーでない場合、見直す対象にしない",
      isMember: false,
      expected: false,
    },
  ])("$name", async ({ isMember, expected }) => {
    // arrange
    const follower = accountFactory();
    const followee = accountFactory();
    if (isMember) {
      registrationQuery.add(follower.did);
    }
    const record = recordFactory({
      uri: `at://${follower.did}/app.bsky.graph.follow/followrkey`,
      json: {
        $type: "app.bsky.graph.follow",
        subject: followee.did,
        createdAt: new Date().toISOString(),
      },
    });

    // act
    const dids = await trackingPolicyService.reposToSync({
      ctx: { db },
      record,
    });

    // assert
    expect(dids).toEqual(expected ? [followee.did] : []);
  });
});
