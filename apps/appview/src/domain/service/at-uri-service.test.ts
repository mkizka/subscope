import { AtUri } from "@atproto/syntax";
import { beforeEach, describe, expect, test } from "vitest";

import { HandleResolutionError } from "../../application/interfaces/handle-resolver.js";
import { testRegistry, type TestServices } from "../../shared/test-utils.js";

describe("AtUriService", () => {
  let atUriService: TestServices["atUriService"];
  let handleResolver: TestServices["handleResolver"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    atUriService = services.atUriService;
    handleResolver = services.handleResolver;
  });

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
