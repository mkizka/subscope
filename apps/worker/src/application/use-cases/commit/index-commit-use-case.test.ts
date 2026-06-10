import { AtUri } from "@atproto/syntax";
import { Record } from "@repo/common/domain";
import { actorFactory, subscriptionFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";
import type { IndexCommitCommand } from "./index-commit-command.js";

describe("IndexCommitUseCase", () => {
  let services: TestServices;
  beforeEach(async () => {
    services = await testRegistry.resolve();
  });

  const jobLogger = { log: vi.fn() };

  describe("create/updateオペレーション", () => {
    test("有効なpost作成オペレーションの場合、レコードがインデックスされる", async () => {
      const {
        indexCommitUseCase,
        actorRepository,
        subscriptionRepository,
        postRepository,
      } = services;
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
      await indexCommitUseCase.execute(command);

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
      const {
        indexCommitUseCase,
        actorRepository,
        subscriptionRepository,
        recordRepository,
        db,
      } = services;
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
      await indexCommitUseCase.execute(createCommand);

      const deleteCommand: IndexCommitCommand = {
        commit: { operation: "delete" as const, uri },
        live: true,
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

      const deletedRecord = await recordRepository.findByUri({ ctx, uri });
      expect(deletedRecord).toBeNull();
    });
  });

  describe("RecordValidationError", () => {
    test("RecordValidationErrorが発生した場合、エラーメッセージをログに記録して正常終了する", async () => {
      const { indexCommitUseCase, actorRepository, subscriptionRepository } =
        services;
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
      const { indexCommitUseCase } = services;
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
      await expect(indexCommitUseCase.execute(command)).rejects.toThrow(
        "Unsupported collection: unsupported.collection",
      );
    });
  });
});
