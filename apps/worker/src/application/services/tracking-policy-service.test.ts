import { beforeEach, describe, expect, test } from "vitest";

import { accountFactory } from "../../domain/account.factory.js";
import { testRegistry, type TestServices } from "../../shared/test-utils.js";
import { parseRecord } from "../dto/parsed-record.js";
import { recordFactory } from "../dto/record.factory.js";

describe("TrackingPolicyService", () => {
  let trackingPolicyService: TestServices["trackingPolicyService"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    trackingPolicyService = services.trackingPolicyService;
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
  ])("$name", ({ isMember, expected }) => {
    // arrange
    const follower = accountFactory();
    const followee = accountFactory();
    const record = recordFactory({
      uri: `at://${follower.did}/app.bsky.graph.follow/followrkey`,
      json: {
        $type: "app.bsky.graph.follow",
        subject: followee.did,
        createdAt: new Date().toISOString(),
      },
    });

    // act
    const dids = trackingPolicyService.reposToSync({
      parsed: parseRecord(record),
      author: { did: follower.did, isMember },
    });

    // assert
    expect(dids).toEqual(expected ? [followee.did] : []);
  });
});
