import { AtUri } from "@atproto/syntax";
import { Record } from "@repo/common/domain";
import { actorFactory, subscriptionFactory } from "@repo/common/test";
import { describe, expect, test, vi } from "vitest";

import { testInjector } from "../../../shared/test-utils.js";
import type { IndexCommitCommand } from "./index-commit-command.js";
import { IndexCommitUseCase } from "./index-commit-use-case.js";

describe("IndexCommitUseCase", () => {
  const indexCommitUseCase = testInjector.injectClass(IndexCommitUseCase);

  const actorRepo = testInjector.resolve("actorRepository");
  const recordRepo = testInjector.resolve("recordRepository");
  const postRepo = testInjector.resolve("postRepository");
  const subscriptionRepo = testInjector.resolve("subscriptionRepository");
  const indexTargetRepo = testInjector.resolve("indexTargetRepository");

  const ctx = {
    db: testInjector.resolve("db"),
  };

  const jobLogger = { log: vi.fn() };

  describe("create/updateオペレーション", () => {
    test("有効なpost作成オペレーションの場合、レコードがインデックスされる", async () => {
      // arrange
      const actor = actorFactory();
      actorRepo.add(actor);

      const subscription = subscriptionFactory({ actorDid: actor.did });
      subscriptionRepo.add(subscription);
      await indexTargetRepo.addSubscriber(actor.did);
      await indexTargetRepo.addTrackedActor(actor.did);

      const uri = new AtUri(`at://${actor.did}/app.bsky.feed.post/123`);
      const record = Record.fromJson({
        uri,
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          text: "Hello world",
          createdAt: new Date().toISOString(),
        },
        indexedAt: new Date(),
      });
      const commit = {
        operation: "create" as const,
        uri,
        record,
      };
      const command: IndexCommitCommand = { commit, jobLogger };

      // act
      await indexCommitUseCase.execute(command);

      // assert
      expect(jobLogger.log).toHaveBeenCalledWith(
        `Starting indexing for commit: ${uri.toString()}`,
      );
      expect(jobLogger.log).toHaveBeenCalledWith(
        "Indexing completed successfully.",
      );

      const savedPost = postRepo.findByUri(uri);
      expect(savedPost).not.toBeNull();
      expect(savedPost?.uri.toString()).toBe(uri.toString());
      expect(savedPost?.cid).toBe("cid123");
      expect(savedPost?.actorDid).toBe(actor.did);
      expect(savedPost?.text).toBe("Hello world");
    });
  });

  describe("deleteオペレーション", () => {
    test("削除オペレーションの場合、レコードを削除する", async () => {
      // arrange
      const actor = actorFactory();
      actorRepo.add(actor);

      const subscription = subscriptionFactory({ actorDid: actor.did });
      subscriptionRepo.add(subscription);
      await indexTargetRepo.addSubscriber(actor.did);
      await indexTargetRepo.addTrackedActor(actor.did);

      const uri = new AtUri(`at://${actor.did}/app.bsky.feed.post/123`);
      const record = Record.fromJson({
        uri,
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          text: "To be deleted",
          createdAt: new Date().toISOString(),
        },
        indexedAt: new Date(),
      });
      const createCommand: IndexCommitCommand = {
        commit: { operation: "create" as const, uri, record },
        jobLogger,
      };
      await indexCommitUseCase.execute(createCommand);

      const deleteCommand: IndexCommitCommand = {
        commit: { operation: "delete" as const, uri },
        jobLogger,
      };

      // act
      await indexCommitUseCase.execute(deleteCommand);

      // assert
      expect(jobLogger.log).toHaveBeenCalledWith(
        `Starting indexing for commit: ${uri.toString()}`,
      );
      expect(jobLogger.log).toHaveBeenCalledWith(
        "Indexing completed successfully.",
      );

      const deletedRecord = await recordRepo.findByUri({ ctx, uri });
      expect(deletedRecord).toBeNull();
    });
  });

  describe("RecordValidationError", () => {
    test("RecordValidationErrorが発生した場合、エラーメッセージをログに記録して正常終了する", async () => {
      // arrange
      const actor = actorFactory();
      actorRepo.add(actor);

      const subscription = subscriptionFactory({ actorDid: actor.did });
      subscriptionRepo.add(subscription);
      await indexTargetRepo.addSubscriber(actor.did);
      await indexTargetRepo.addTrackedActor(actor.did);

      const uri = new AtUri(`at://${actor.did}/app.bsky.feed.post/123`);
      const record = Record.fromJson({
        uri,
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          // createdAtがないため、バリデーションエラーになる想定
        },
        indexedAt: new Date(),
      });
      const commit = {
        operation: "create" as const,
        uri,
        record,
      };
      const command: IndexCommitCommand = { commit, jobLogger };

      // act
      await indexCommitUseCase.execute(command);

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
      const record = Record.fromJson({
        uri,
        cid: "cid123",
        json: {
          $type: "unsupported.collection",
          text: "Hello world",
        },
        indexedAt: new Date(),
      });
      const commit = {
        operation: "create" as const,
        uri,
        record,
      };
      const command: IndexCommitCommand = { commit, jobLogger };

      // act & assert
      await expect(indexCommitUseCase.execute(command)).rejects.toThrow(
        "Unsupported collection: unsupported.collection",
      );
    });
  });
});
