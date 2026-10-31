import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../shared/api-test-utils.js";
import { emptyListResponses } from "./empty-responses.js";

describe("未対応の読み取りAPI", () => {
  test.each([...emptyListResponses])(
    "emptyResponses-1: 対象のAPIは空の一覧を返す (%s)",
    async (nsid, expected) => {
      // arrange
      const { url } = await setupApiTest();

      // act
      const res = await fetch(`${url}/xrpc/${nsid}`);

      // assert
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(expected);
    },
  );

  test("emptyResponses-2: app.bsky.notification.getPreferences はすべての通知を有効にした既定値を返す", async () => {
    // arrange
    const { url } = await setupApiTest();

    // act
    const res = await fetch(`${url}/xrpc/app.bsky.notification.getPreferences`);

    // assert
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      preferences: {
        chat: { include: "all", push: true },
        like: { include: "all", list: true, push: true },
        verified: { list: true, push: true },
      },
    });
  });
});
