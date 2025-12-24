import { asDid } from "@atproto/did";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { TapClient } from "./tap-client.js";

describe("TapClient", () => {
  const tapUrl = "https://tap.example.com";
  let tapClient: TapClient;

  beforeEach(() => {
    tapClient = new TapClient(tapUrl);
  });

  describe("addRepo", () => {
    test("成功した場合、didをTapに登録する", async () => {
      // arrange
      const did = asDid("did:plc:test123");
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(""),
      });
      global.fetch = mockFetch;

      // act
      await tapClient.addRepo(did);

      // assert
      expect(mockFetch).toHaveBeenCalledWith(
        "https://tap.example.com/repos/add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ did }),
        },
      );
    });

    test("ネットワークエラーの場合、エラーをスローする", async () => {
      // arrange
      const did = asDid("did:plc:test123");
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
      global.fetch = mockFetch;

      // act & assert
      await expect(tapClient.addRepo(did)).rejects.toThrow("Network error");
    });

    test("HTTPエラーレスポンスの場合、エラーをスローする", async () => {
      // arrange
      const did = asDid("did:plc:test123");
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      });
      global.fetch = mockFetch;

      // act & assert
      await expect(tapClient.addRepo(did)).rejects.toThrow(
        "Failed to add repo to Tap: 500 Internal Server Error",
      );
    });
  });
});
