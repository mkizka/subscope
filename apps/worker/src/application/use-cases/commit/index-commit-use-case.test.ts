import { AtUri } from "@atproto/syntax";
import { Record, RecordValidationError } from "@repo/common/domain";
import { describe, expect, test, vi } from "vitest";

import { testInjector } from "../../../shared/test-utils.js";
import { IndexRecordService } from "../../services/index-record-service.js";
import type { IndexCommitCommand } from "./index-commit-command.js";
import { IndexCommitUseCase } from "./index-commit-use-case.js";

const createMockJobLogger = () => ({
  log: vi.fn(),
});

describe("IndexCommitUseCase", () => {
  const indexCommitUseCase = testInjector.injectClass(IndexCommitUseCase);

  describe("create/updateオペレーション", () => {
    test("upsertメソッドを呼び出す", async () => {
      // arrange
      const spyUpsert = vi.spyOn(IndexRecordService.prototype, "upsert");
      const mockJobLogger = createMockJobLogger();
      const uri = new AtUri("at://did:plc:example/app.bsky.feed.post/123");
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
      const command: IndexCommitCommand = { commit, jobLogger: mockJobLogger };

      // act
      await indexCommitUseCase.execute(command);

      // assert
      expect(mockJobLogger.log).toHaveBeenCalledWith(
        `Starting indexing for commit: ${uri.toString()}`,
      );
      expect(spyUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          record: commit.record,
          jobLogger: mockJobLogger,
          depth: 0,
        }),
      );
      expect(mockJobLogger.log).toHaveBeenCalledWith(
        "Indexing completed successfully.",
      );
    });
  });

  describe("deleteオペレーション", () => {
    test("削除オペレーションの場合、レコードを削除する", async () => {
      // arrange
      const spyDelete = vi.spyOn(IndexRecordService.prototype, "delete");
      const spyUpsert = vi.spyOn(IndexRecordService.prototype, "upsert");
      const mockJobLogger = createMockJobLogger();
      const uri = new AtUri("at://did:plc:example/app.bsky.feed.post/123");
      const commit = {
        operation: "delete" as const,
        uri,
      };
      const command: IndexCommitCommand = { commit, jobLogger: mockJobLogger };

      // act
      await indexCommitUseCase.execute(command);

      // assert
      expect(mockJobLogger.log).toHaveBeenCalledWith(
        `Starting indexing for commit: ${uri.toString()}`,
      );
      expect(spyDelete).toHaveBeenCalledWith(
        expect.objectContaining({
          uri,
        }),
      );
      expect(spyUpsert).not.toHaveBeenCalled();
      expect(mockJobLogger.log).toHaveBeenCalledWith(
        "Indexing completed successfully.",
      );
    });
  });

  describe("RecordValidationError", () => {
    test("RecordValidationErrorが発生した場合、エラーメッセージをログに記録して正常終了する", async () => {
      // arrange
      const spyUpsert = vi.spyOn(IndexRecordService.prototype, "upsert");
      const mockJobLogger = createMockJobLogger();
      const uri = new AtUri("at://did:plc:example/app.bsky.feed.post/123");
      const validationErrorMessage = "Invalid record schema";
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
      const command: IndexCommitCommand = { commit, jobLogger: mockJobLogger };

      spyUpsert.mockRejectedValueOnce(
        new RecordValidationError(validationErrorMessage, uri),
      );

      // act
      await indexCommitUseCase.execute(command);

      // assert
      expect(mockJobLogger.log).toHaveBeenCalledWith(
        `Starting indexing for commit: ${uri.toString()}`,
      );
      expect(mockJobLogger.log).toHaveBeenCalledWith(
        `Record validation error: ${validationErrorMessage} for URI: ${uri.toString()}`,
      );
      expect(mockJobLogger.log).not.toHaveBeenCalledWith(
        "Indexing completed successfully.",
      );
    });

    test("RecordValidationError以外のエラーが発生した場合、エラーを再スローする", async () => {
      // arrange
      const spyUpsert = vi.spyOn(IndexRecordService.prototype, "upsert");
      const mockJobLogger = createMockJobLogger();
      const uri = new AtUri("at://did:plc:example/app.bsky.feed.post/123");
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
      const command: IndexCommitCommand = { commit, jobLogger: mockJobLogger };

      const genericError = new Error("Database connection error");
      spyUpsert.mockRejectedValueOnce(genericError);

      // act & assert
      await expect(indexCommitUseCase.execute(command)).rejects.toThrow(
        genericError,
      );
    });
  });
});
