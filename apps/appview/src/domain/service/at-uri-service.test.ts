import { AtUri } from "@atproto/syntax";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { HandleResolutionError } from "../../application/interfaces/handle-resolver.js";
import { HandleResolver } from "../../infrastructure/handle-resolver.js";
import { AtUriService, InvalidHostnameError } from "./at-uri-service.js";

describe("AtUriService", () => {
  const { testInjector, ctx } = testSetup;

  const atUriService = testInjector
    .provideClass("handleResolver", HandleResolver)
    .injectClass(AtUriService);

  describe("resolveHostname", () => {
    test("DIDが含まれるURIの場合、そのまま返す", async () => {
      // arrange
      const uri = new AtUri(
        "at://did:plc:example123/app.bsky.feed.post/abc123",
      );

      // act
      const result = await atUriService.resolveHostname(uri);

      // assert
      expect(result.toString()).toBe(
        "at://did:plc:example123/app.bsky.feed.post/abc123",
      );
    });

    test("handleが含まれるURIの場合、DIDに変換して返す", async () => {
      // arrange
      await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:resolved123",
          handle: () => "example.com",
        })
        .create();
      const uri = new AtUri("at://example.com/app.bsky.feed.post/xyz789");

      // act
      const result = await atUriService.resolveHostname(uri);

      // assert
      expect(result.toString()).toBe(
        "at://did:plc:resolved123/app.bsky.feed.post/xyz789",
      );
    });

    test("無効なhostnameの場合、InvalidHostnameErrorをスローする", async () => {
      // arrange
      const uri = new AtUri("at://123invalid/app.bsky.feed.post/abc123");

      // act & assert
      await expect(atUriService.resolveHostname(uri)).rejects.toThrow(
        InvalidHostnameError,
      );
      await expect(atUriService.resolveHostname(uri)).rejects.toThrow(
        "Invalid hostname in URI: at://123invalid/app.bsky.feed.post/abc123",
      );
    });

    test("handleが解決できない場合、HandleResolutionErrorをスローする", async () => {
      // arrange
      const uri = new AtUri("at://notfound.example/app.bsky.feed.post/abc123");

      // act & assert
      await expect(atUriService.resolveHostname(uri)).rejects.toThrow(
        HandleResolutionError,
      );
      await expect(atUriService.resolveHostname(uri)).rejects.toThrow(
        "Failed to resolve handle: notfound.example",
      );
    });
  });
});
