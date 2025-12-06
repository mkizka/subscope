import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { Record } from "@repo/common/domain";
import { actorFactory } from "@repo/common/test";
import { describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";

import { testInjector } from "../../../shared/test-utils.js";
import type { IRepoFetcher } from "../../interfaces/external/repo-fetcher.js";
import { SyncRepoUseCase } from "./sync-repo-use-case.js";

vi.mock("../../../shared/env.js", () => ({
  env: { SYNC_REPO_BATCH_SIZE: 2 },
}));

const mockRepoFetcher = mock<IRepoFetcher>();

const actorRepository = testInjector.resolve("actorRepository");
const recordRepository = testInjector.resolve("recordRepository");
const postRepository = testInjector.resolve("postRepository");
const followRepository = testInjector.resolve("followRepository");
const likeRepository = testInjector.resolve("likeRepository");
const jobLogger = testInjector.resolve("jobLogger");
const ctx = {
  db: testInjector.resolve("db"),
};
const syncRepoUseCase = testInjector
  .provideValue("repoFetcher", mockRepoFetcher)
  .injectClass(SyncRepoUseCase);

describe("SyncRepoUseCase", () => {
  test("レコードがバッチサイズで分割されて処理される", async () => {
    // arrange
    const actor = actorFactory();
    actorRepository.add(actor);
    const did = actor.did;
    const records = Array.from({ length: 5 }, (_, i) =>
      Record.fromJson({
        uri: AtUri.make(did, "app.bsky.feed.post", `${i + 1}`).toString(),
        cid: `cid${i + 1}`,
        json: {
          $type: "app.bsky.feed.post",
          text: `Post ${i + 1}`,
          createdAt: new Date().toISOString(),
        },
        indexedAt: new Date(),
      }),
    );
    mockRepoFetcher.fetch.mockResolvedValue(records);

    // act
    await syncRepoUseCase.execute({ did, jobLogger });

    // assert
    const savedRecords = recordRepository.findAll();
    expect(savedRecords.length).toBe(5);
  });

  test("レコードが0件の場合、処理されない", async () => {
    // arrange
    const actor = actorFactory();
    actorRepository.add(actor);
    const did = actor.did;
    mockRepoFetcher.fetch.mockResolvedValue([]);

    // act
    await syncRepoUseCase.execute({ did, jobLogger });

    // assert
    const savedRecords = recordRepository.findAll();
    expect(savedRecords.length).toBe(0);
    const updatedActor = await actorRepository.findByDid({ ctx, did });
    expect(updatedActor?.syncRepoStatus).toBe("synchronized");
    expect(updatedActor?.syncRepoVersion).toBe(1);
  });

  test("サポートされていないコレクションはフィルタリングされる", async () => {
    // arrange
    const actor = actorFactory();
    actorRepository.add(actor);
    const did = actor.did;
    const records = [
      Record.fromJson({
        uri: AtUri.make(did, "app.bsky.feed.post", "1").toString(),
        cid: "cid1",
        json: {
          $type: "app.bsky.feed.post",
          text: "Test post",
          createdAt: new Date().toISOString(),
        },
        indexedAt: new Date(),
      }),
      Record.fromJson({
        uri: AtUri.make(did, "unsupported.collection", "1").toString(),
        cid: "cid2",
        json: { record: {} },
        indexedAt: new Date(),
      }),
      Record.fromJson({
        uri: AtUri.make(did, "app.bsky.feed.like", "1").toString(),
        cid: "bafyreidfayvfuwqa7qlnopdjiqrxzs6blmoeu4rujcjtnci5beludirz2a",
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: "at://did:plc:test/app.bsky.feed.post/1",
            cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
          },
          createdAt: new Date().toISOString(),
        },
        indexedAt: new Date(),
      }),
    ];
    mockRepoFetcher.fetch.mockResolvedValue(records);

    // act
    await syncRepoUseCase.execute({ did, jobLogger });

    // assert
    const savedRecords = recordRepository.findAll();
    expect(savedRecords.length).toBe(2);
    expect(savedRecords.map((r) => r.collection).sort()).toEqual([
      "app.bsky.feed.like",
      "app.bsky.feed.post",
    ]);
  });

  test("Actorが見つからない場合、エラーがスローされる", async () => {
    // arrange
    const did = asDid("did:plc:notfound");
    mockRepoFetcher.fetch.mockResolvedValue([]);

    // act & assert
    await expect(syncRepoUseCase.execute({ did, jobLogger })).rejects.toThrow(
      `Actor not found: ${did}`,
    );
  });

  test("バッチ処理完了後、ステータスがsynchronizedに更新される", async () => {
    // arrange
    const actor = actorFactory();
    actorRepository.add(actor);
    const did = actor.did;
    mockRepoFetcher.fetch.mockResolvedValue([
      Record.fromJson({
        uri: AtUri.make(did, "app.bsky.feed.post", "1").toString(),
        cid: "cid1",
        json: {
          $type: "app.bsky.feed.post",
          text: "Test post",
          createdAt: new Date().toISOString(),
        },
        indexedAt: new Date(),
      }),
    ]);

    // act
    await syncRepoUseCase.execute({ did, jobLogger });

    // assert
    const updatedActor = await actorRepository.findByDid({ ctx, did });
    expect(updatedActor?.syncRepoStatus).toBe("synchronized");
    expect(updatedActor?.syncRepoVersion).toBe(1);
  });

  test("フォローレコードと他のレコードが正しく処理される", async () => {
    // arrange
    const actor = actorFactory();
    actorRepository.add(actor);
    const did = actor.did;

    const followedActor = actorFactory();
    actorRepository.add(followedActor);

    const records = [
      Record.fromJson({
        uri: AtUri.make(did, "app.bsky.feed.post", "1").toString(),
        cid: "cid1",
        json: {
          $type: "app.bsky.feed.post",
          text: "Test post",
          createdAt: new Date().toISOString(),
        },
        indexedAt: new Date(),
      }),
      Record.fromJson({
        uri: AtUri.make(did, "app.bsky.graph.follow", "1").toString(),
        cid: "cid2",
        json: {
          $type: "app.bsky.graph.follow",
          subject: followedActor.did,
          createdAt: new Date().toISOString(),
        },
        indexedAt: new Date(),
      }),
      Record.fromJson({
        uri: AtUri.make(did, "app.bsky.feed.like", "1").toString(),
        cid: "bafyreidfayvfuwqa7qlnopdjiqrxzs6blmoeu4rujcjtnci5beludirz2a",
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: "at://did:plc:test/app.bsky.feed.post/1",
            cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
          },
          createdAt: new Date().toISOString(),
        },
        indexedAt: new Date(),
      }),
      Record.fromJson({
        uri: AtUri.make(did, "app.bsky.graph.follow", "2").toString(),
        cid: "cid4",
        json: {
          $type: "app.bsky.graph.follow",
          subject: followedActor.did,
          createdAt: new Date().toISOString(),
        },
        indexedAt: new Date(),
      }),
    ];
    mockRepoFetcher.fetch.mockResolvedValue(records);

    // act
    await syncRepoUseCase.execute({ did, jobLogger });

    // assert
    const savedRecords = recordRepository.findAll();
    expect(savedRecords.length).toBe(4);
    const savedPosts = postRepository.findAll();
    expect(savedPosts.length).toBe(1);
    const savedFollows = followRepository.findAll();
    expect(savedFollows.length).toBe(2);
    const savedLikes = likeRepository.findAll();
    expect(savedLikes.length).toBe(1);
  });

  test("処理完了後、ステータスがsynchronizedに更新される", async () => {
    // arrange
    const actor = actorFactory();
    actorRepository.add(actor);
    const did = actor.did;

    const followedActor = actorFactory();
    actorRepository.add(followedActor);

    const followRecord = Record.fromJson({
      uri: AtUri.make(did, "app.bsky.graph.follow", "1").toString(),
      cid: "cid1",
      json: {
        $type: "app.bsky.graph.follow",
        subject: followedActor.did,
        createdAt: new Date().toISOString(),
      },
      indexedAt: new Date(),
    });
    const postRecord = Record.fromJson({
      uri: AtUri.make(did, "app.bsky.feed.post", "1").toString(),
      cid: "cid2",
      json: {
        $type: "app.bsky.feed.post",
        text: "Test post",
        createdAt: new Date().toISOString(),
      },
      indexedAt: new Date(),
    });
    mockRepoFetcher.fetch.mockResolvedValue([followRecord, postRecord]);

    // act
    await syncRepoUseCase.execute({ did, jobLogger });

    // assert
    const updatedActor = await actorRepository.findByDid({ ctx, did });
    expect(updatedActor?.syncRepoStatus).toBe("synchronized");
    expect(updatedActor?.syncRepoVersion).toBe(1);
  });

  test("RepoFetcherでエラーが発生した場合、ステータスがfailedに更新される", async () => {
    // arrange
    const actor = actorFactory();
    actorRepository.add(actor);
    const did = actor.did;
    mockRepoFetcher.fetch.mockRejectedValue(new Error("Fetch error"));

    // act & assert
    await expect(syncRepoUseCase.execute({ did, jobLogger })).rejects.toThrow(
      "Fetch error",
    );

    const updatedActor = await actorRepository.findByDid({ ctx, did });
    expect(updatedActor?.syncRepoStatus).toBe("failed");
    expect(updatedActor?.syncRepoVersion).toBe(1);
  });
});
