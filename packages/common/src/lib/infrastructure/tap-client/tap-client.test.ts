import { asDid } from "@atproto/did";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { TapClient } from "./tap-client.js";

const mockAddRepos = vi.fn();

vi.mock("@atproto/tap", () => ({
  Tap: vi.fn(function () {
    return {
      addRepos: mockAddRepos,
    };
  }),
}));

describe("TapClient", () => {
  const tapUrl = "https://tap.example.com";
  let tapClient: TapClient;

  beforeEach(() => {
    mockAddRepos.mockResolvedValue(undefined);
    tapClient = new TapClient(tapUrl);
  });

  describe("addRepo", () => {
    test("成功した場合、didをTapに登録する", async () => {
      // arrange
      const did = asDid("did:plc:test123");

      // act
      await tapClient.addRepo(did);

      // assert
      expect(mockAddRepos).toHaveBeenCalledWith([did]);
    });

    test("ネットワークエラーの場合、エラーをスローする", async () => {
      // arrange
      const did = asDid("did:plc:test123");
      mockAddRepos.mockRejectedValue(new Error("Network error"));

      // act & assert
      await expect(tapClient.addRepo(did)).rejects.toThrow("Network error");
    });

    test("APIエラーの場合、エラーをスローする", async () => {
      // arrange
      const did = asDid("did:plc:test123");
      mockAddRepos.mockRejectedValue(new Error("API error"));

      // act & assert
      await expect(tapClient.addRepo(did)).rejects.toThrow("API error");
    });
  });
});
