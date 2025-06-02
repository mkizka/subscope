/* eslint-disable @typescript-eslint/unbound-method */
import { AtUri } from "@atproto/syntax";
import type {
  ITransactionManager,
  TransactionContext,
} from "@dawn/common/domain";
import { Record } from "@dawn/common/domain";
import { beforeEach, describe, expect, it } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";

import type { JobLogger } from "../shared/job.js";
import type { IndexCommitCommand } from "./index-commit-command.js";
import { IndexCommitUseCase } from "./index-commit-use-case.js";
import type { IndexCommitService } from "./service/index-commit-service.js";

describe("IndexCommitUseCase", () => {
  let indexCommitUseCase: IndexCommitUseCase;
  let mockTransactionManager: MockProxy<ITransactionManager>;
  let mockIndexCommitService: MockProxy<IndexCommitService>;
  let mockJobLogger: MockProxy<JobLogger>;

  beforeEach(() => {
    mockTransactionManager = mock<ITransactionManager>();
    mockTransactionManager.transaction.mockImplementation(
      async (fn: (ctx: TransactionContext) => Promise<unknown>) => {
        await fn({} as TransactionContext);
      },
    );

    mockIndexCommitService = mock<IndexCommitService>();
    mockJobLogger = mock<JobLogger>();

    indexCommitUseCase = new IndexCommitUseCase(
      mockTransactionManager,
      mockIndexCommitService,
    );
  });

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
        ctx: {},
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
        ctx: {},
        uri,
      });
      expect(mockIndexCommitService.upsert).not.toHaveBeenCalled();
    });
  });
});
