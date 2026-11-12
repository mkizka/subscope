import { asDid } from "@atproto/did";
import { Tap } from "@atproto/tap";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { TapClient } from "./tap-client.js";

const mockAddRepos = vi.spyOn(Tap.prototype, "addRepos");
const mockRemoveRepos = vi.spyOn(Tap.prototype, "removeRepos");

describe("TapClient", () => {
  const tapUrl = "https://tap.example.com";
  let tapClient: TapClient;

  beforeEach(() => {
    mockAddRepos.mockResolvedValue(undefined);
    mockRemoveRepos.mockResolvedValue(undefined);
    tapClient = new TapClient({ TAP_URL: tapUrl });
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

  describe("removeRepo", () => {
    test("成功した場合、didをTapから削除する", async () => {
      // arrange
      const did = asDid("did:plc:test123");

      // act
      await tapClient.removeRepo(did);

      // assert
      expect(mockRemoveRepos).toHaveBeenCalledWith([did]);
    });

    test("ネットワークエラーの場合、エラーをスローする", async () => {
      // arrange
      const did = asDid("did:plc:test123");
      mockRemoveRepos.mockRejectedValue(new Error("Network error"));

      // act & assert
      await expect(tapClient.removeRepo(did)).rejects.toThrow("Network error");
    });

    test("APIエラーの場合、エラーをスローする", async () => {
      // arrange
      const did = asDid("did:plc:test123");
      mockRemoveRepos.mockRejectedValue(new Error("API error"));

      // act & assert
      await expect(tapClient.removeRepo(did)).rejects.toThrow("API error");
    });
  });
});
