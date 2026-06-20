import { AtUri } from "@atproto/syntax";
import { Record } from "@repo/common/domain";
import { actorFactory, subscriptionFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";
import type { IndexCommitCommand } from "./index-commit-command.js";

describe("IndexCommitUseCase", () => {
  let sut: TestServices["indexCommitUseCase"];
  let actorRepository: TestServices["actorRepository"];
  let subscriptionRepository: TestServices["subscriptionRepository"];
  let postRepository: TestServices["postRepository"];
  let recordRepository: TestServices["recordRepository"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    sut = services.indexCommitUseCase;
    actorRepository = services.actorRepository;
    subscriptionRepository = services.subscriptionRepository;
    postRepository = services.postRepository;
    recordRepository = services.recordRepository;
    db = services.db;
  });

  const jobLogger = { log: vi.fn() };

  describe("create/updateオペレーション", () => {
    test("有効なpost作成オペレーションの場合、レコードがインデックスされる", async () => {
      // arrange
      const actor = actorFactory();
      actorRepository.add(actor);

      const subscription = subscriptionFactory({ actorDid: actor.did });
      subscriptionRepository.add(subscription);

      const uri = new AtUri(`at://${actor.did}/app.bsky.feed.post/123`);
      const record = Record.create({
        uri,
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          text: "Hello world",
          createdAt: new Date().toISOString(),
        },
      });
      const commit = {
        operation: "create" as const,
        uri,
        record,
      };
      const command: IndexCommitCommand = { commit, live: true, jobLogger };

      // act
      await sut.execute(command);

      // assert
      expect(jobLogger.log).toHaveBeenCalledWith(
        `Starting indexing for commit: ${uri.toString()}`,
      );
      expect(jobLogger.log).toHaveBeenCalledWith(
        "Indexing completed successfully.",
      );

      const savedPost = postRepository.findByUri(uri);
      expect(savedPost).not.toBeNull();
      expect(savedPost?.uri.toString()).toBe(uri.toString());
      expect(savedPost?.cid).toBe("cid123");
      expect(savedPost?.actorDid).toBe(actor.did);
      expect(savedPost?.text).toBe("Hello world");
    });
  });

  describe("deleteオペレーション", () => {
    test("削除オペレーションの場合、レコードを削除する", async () => {
      const ctx = { db };
      // arrange
      const actor = actorFactory();
      actorRepository.add(actor);

      const subscription = subscriptionFactory({ actorDid: actor.did });
      subscriptionRepository.add(subscription);

      const uri = new AtUri(`at://${actor.did}/app.bsky.feed.post/123`);
      const record = Record.create({
        uri,
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          text: "To be deleted",
          createdAt: new Date().toISOString(),
        },
      });
      const createCommand: IndexCommitCommand = {
        commit: { operation: "create" as const, uri, record },
        live: true,
        jobLogger,
      };
      await sut.execute(createCommand);

      const deleteCommand: IndexCommitCommand = {
        commit: { operation: "delete" as const, uri },
        live: true,
        jobLogger,
      };

      // act
      await sut.execute(deleteCommand);

      // assert
      expect(jobLogger.log).toHaveBeenCalledWith(
        `Starting indexing for commit: ${uri.toString()}`,
      );
      expect(jobLogger.log).toHaveBeenCalledWith(
        "Indexing completed successfully.",
      );

      const deletedRecord = await recordRepository.findByUri({ ctx, uri });
      expect(deletedRecord).toBeNull();
    });
  });

  describe("RecordValidationError", () => {
    test("RecordValidationErrorが発生した場合、エラーメッセージをログに記録して正常終了する", async () => {
      // arrange
      const actor = actorFactory();
      actorRepository.add(actor);

      const subscription = subscriptionFactory({ actorDid: actor.did });
      subscriptionRepository.add(subscription);

      const uri = new AtUri(`at://${actor.did}/app.bsky.feed.post/123`);
      const record = Record.create({
        uri,
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          // createdAtがないため、バリデーションエラーになる想定
        },
      });
      const commit = {
        operation: "create" as const,
        uri,
        record,
      };
      const command: IndexCommitCommand = { commit, live: true, jobLogger };

      // act
      await sut.execute(command);

      // assert
      expect(jobLogger.log).toHaveBeenCalledWith(
        `Starting indexing for commit: ${uri.toString()}`,
      );
      expect(jobLogger.log).toHaveBeenCalledWith(
        expect.stringMatching(/Record validation error:/),
      );
      expect(jobLogger.log).not.toHaveBeenCalledWith(
        "Indexing completed successfully.",
      );
    });

    test("RecordValidationError以外のエラーが発生した場合、エラーを再スローする", async () => {
      // arrange
      const uri = new AtUri("at://did:plc:example/unsupported.collection/123");
      const record = Record.create({
        uri,
        cid: "cid123",
        json: {
          $type: "unsupported.collection",
          text: "Hello world",
        },
      });
      const commit = {
        operation: "create" as const,
        uri,
        record,
      };
      const command: IndexCommitCommand = { commit, live: true, jobLogger };

      // act & assert
      await expect(sut.execute(command)).rejects.toThrow(
        "Unsupported collection: unsupported.collection",
      );
    });
  });
});
