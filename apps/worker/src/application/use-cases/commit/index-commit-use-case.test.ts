/* eslint-disable @typescript-eslint/unbound-method */
import { AtUri } from "@atproto/syntax";
import type {
  ITransactionManager,
  TransactionContext,
} from "@dawn/common/domain";
import { Record } from "@dawn/common/domain";
import { describe, expect, it } from "vitest";
import { mock } from "vitest-mock-extended";

import type { JobLogger } from "../../../shared/job.js";
import type { IndexCommitService } from "../../services/indexer/index-commit-service.js";
import type { IndexCommitCommand } from "./index-commit-command.js";
import { IndexCommitUseCase } from "./index-commit-use-case.js";

const mockIndexCommitService = mock<IndexCommitService>();
const mockJobLogger = mock<JobLogger>();
const mockTransactionManager = mock<ITransactionManager>();
const mockTransactionContext = mock<TransactionContext>();
mockTransactionManager.transaction.mockImplementation(async (fn) => {
  await fn(mockTransactionContext);
});

const indexCommitUseCase = new IndexCommitUseCase(
  mockTransactionManager,
  mockIndexCommitService,
);

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
      expect(mockIndexCommitService.upsert).toHaveBeenCalledWith({
        ctx: mockTransactionContext,
        record: commit.record,
        jobLogger: mockJobLogger,
      });
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
      expect(mockIndexCommitService.delete).toHaveBeenCalledWith({
        ctx: mockTransactionContext,
        uri,
      });
      expect(mockIndexCommitService.upsert).not.toHaveBeenCalled();
    });
  });
});
