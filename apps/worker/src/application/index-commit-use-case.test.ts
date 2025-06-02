/* eslint-disable @typescript-eslint/unbound-method */
import { AtUri } from "@atproto/syntax";
import type {
  ITransactionManager,
  TransactionContext,
} from "@dawn/common/domain";
import { Record } from "@dawn/common/domain";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JobLogger } from "../shared/job.js";
import type { IndexCommitCommand } from "./index-commit-command.js";
import { IndexCommitUseCase } from "./index-commit-use-case.js";
import type { IndexCommitService } from "./service/index-commit-service.js";

describe("IndexCommitUseCase", () => {
  let indexCommitUseCase: IndexCommitUseCase;
  let mockTransactionManager: ITransactionManager;
  let mockIndexCommitService: IndexCommitService;
  let mockJobLogger: JobLogger;

  beforeEach(() => {
    mockTransactionManager = {
      transaction: vi
        .fn()
        .mockImplementation(
          async (fn: (ctx: TransactionContext) => Promise<void>) => {
            await fn({} as TransactionContext);
          },
        ),
    };

    mockIndexCommitService = {
      shouldSave: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    } as unknown as IndexCommitService;

    mockJobLogger = {
      log: vi.fn(),
    } as unknown as JobLogger;

    indexCommitUseCase = new IndexCommitUseCase(
      mockTransactionManager,
      mockIndexCommitService,
    );
  });

  describe("create/updateオペレーション", () => {
    it("保存ルールを満たすレコードの場合、actorとrecordを保存する", async () => {
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

      const shouldSaveMock = vi.mocked(mockIndexCommitService.shouldSave);
      shouldSaveMock.mockResolvedValue(true);

      // act
      await indexCommitUseCase.execute(command);

      // assert
      expect(shouldSaveMock).toHaveBeenCalledWith({
        ctx: {},
        record: commit.record,
      });
      const upsertMock = vi.mocked(mockIndexCommitService.upsert);
      expect(upsertMock).toHaveBeenCalledWith({
        ctx: {},
        record: commit.record,
        jobLogger: mockJobLogger,
      });
    });

    it("保存ルールを満たさないレコードの場合、何も保存しない", async () => {
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

      const shouldSaveMock = vi.mocked(mockIndexCommitService.shouldSave);
      shouldSaveMock.mockResolvedValue(false);

      // act
      await indexCommitUseCase.execute(command);

      // assert
      expect(shouldSaveMock).toHaveBeenCalledWith({
        ctx: {},
        record: commit.record,
      });
      const logMock = vi.mocked(mockJobLogger.log);
      expect(logMock).toHaveBeenCalledWith(
        "Record does not match storage rules, skipping",
      );
      const upsertMock = vi.mocked(mockIndexCommitService.upsert);
      expect(upsertMock).not.toHaveBeenCalled();
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
      const deleteMock = vi.mocked(mockIndexCommitService.delete);
      expect(deleteMock).toHaveBeenCalledWith({
        ctx: {},
        uri,
      });
      const shouldSaveMock = vi.mocked(mockIndexCommitService.shouldSave);
      expect(shouldSaveMock).not.toHaveBeenCalled();
      const upsertMock = vi.mocked(mockIndexCommitService.upsert);
      expect(upsertMock).not.toHaveBeenCalled();
    });
  });
});
