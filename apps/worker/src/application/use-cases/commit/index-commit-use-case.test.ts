/* eslint-disable @typescript-eslint/unbound-method */
import { AtUri } from "@atproto/syntax";
import type {
  ITransactionManager,
  TransactionContext,
} from "@repo/common/domain";
import { Record, RecordValidationError } from "@repo/common/domain";
import { createInjector } from "typed-inject";
import { describe, expect, it } from "vitest";
import { mock } from "vitest-mock-extended";

import type { JobLogger } from "../../../shared/job.js";
import type { IndexRecordService } from "../../services/index-record-service.js";
import type { IndexCommitCommand } from "./index-commit-command.js";
import { IndexCommitUseCase } from "./index-commit-use-case.js";

const mockIndexRecordService = mock<IndexRecordService>();
const mockJobLogger = mock<JobLogger>();
const mockTransactionManager = mock<ITransactionManager>();
const mockTransactionContext = mock<TransactionContext>();
mockTransactionManager.transaction.mockImplementation(async (fn) => {
  await fn(mockTransactionContext);
});

const indexCommitUseCase = createInjector()
  .provideValue("transactionManager", mockTransactionManager)
  .provideValue("indexRecordService", mockIndexRecordService)
  .injectClass(IndexCommitUseCase);

describe("IndexCommitUseCase", () => {
  describe("create/updateオペレーション", () => {
    it("upsertメソッドを呼び出す", async () => {
      // arrange
      const uri = new AtUri("at://did:plc:example/app.bsky.feed.post/123");
      const record = Record.fromJson({
        uri,
        cid: "cid123",
        json: { text: "Hello world", createdAt: new Date().toISOString() },
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
      expect(mockIndexRecordService.upsert).toHaveBeenCalledWith({
        ctx: mockTransactionContext,
        record: commit.record,
        jobLogger: mockJobLogger,
        depth: 0,
      });
      expect(mockJobLogger.log).toHaveBeenCalledWith(
        "Indexing completed successfully.",
      );
    });
  });

  describe("deleteオペレーション", () => {
    it("削除オペレーションの場合、レコードを削除する", async () => {
      // arrange
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
      expect(mockIndexRecordService.delete).toHaveBeenCalledWith({
        ctx: mockTransactionContext,
        uri,
      });
      expect(mockIndexRecordService.upsert).not.toHaveBeenCalled();
      expect(mockJobLogger.log).toHaveBeenCalledWith(
        "Indexing completed successfully.",
      );
    });
  });

  describe("RecordValidationError", () => {
    it("RecordValidationErrorが発生した場合、エラーメッセージをログに記録して正常終了する", async () => {
      // arrange
      const uri = new AtUri("at://did:plc:example/app.bsky.feed.post/123");
      const validationErrorMessage = "Invalid record schema";
      const record = Record.fromJson({
        uri,
        cid: "cid123",
        json: { text: "Hello world", createdAt: new Date().toISOString() },
      });
      const commit = {
        operation: "create" as const,
        uri,
        record,
      };
      const command: IndexCommitCommand = { commit, jobLogger: mockJobLogger };

      mockIndexRecordService.upsert.mockRejectedValueOnce(
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

    it("RecordValidationError以外のエラーが発生した場合、エラーを再スローする", async () => {
      // arrange
      const uri = new AtUri("at://did:plc:example/app.bsky.feed.post/123");
      const record = Record.fromJson({
        uri,
        cid: "cid123",
        json: { text: "Hello world", createdAt: new Date().toISOString() },
      });
      const commit = {
        operation: "create" as const,
        uri,
        record,
      };
      const command: IndexCommitCommand = { commit, jobLogger: mockJobLogger };

      const genericError = new Error("Database connection error");
      mockIndexRecordService.upsert.mockRejectedValueOnce(genericError);

      // act & assert
      await expect(indexCommitUseCase.execute(command)).rejects.toThrow(
        genericError,
      );
    });
  });
});
