import { AtUri } from "@atproto/syntax";
import { describe, expect, test } from "vitest";

import { HandleResolutionError } from "../../application/interfaces/handle-resolver.js";
import { testInjector } from "../../test-utils.js";
import { AtUriService } from "./at-uri-service.js";

describe("AtUriService", () => {
  const atUriService = testInjector.injectClass(AtUriService);
  const handleResolver = testInjector.resolve("handleResolver");

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
      handleResolver.add("example.com", "did:plc:resolved123");
      const uri = new AtUri("at://example.com/app.bsky.feed.post/xyz789");

      // act
      const result = await atUriService.resolveHostname(uri);

      // assert
      expect(result.toString()).toBe(
        "at://did:plc:resolved123/app.bsky.feed.post/xyz789",
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
