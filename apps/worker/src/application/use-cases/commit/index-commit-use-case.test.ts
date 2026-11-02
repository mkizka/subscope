import { AtUri } from "@atproto/syntax";
import { Record } from "@repo/common/domain";
import {
  accountFactory,
  fakeCid,
  registrationFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";
import type { IndexCommitCommand } from "./index-commit-command.js";

describe("IndexCommitUseCase", () => {
  let indexCommitUseCase: TestServices["indexCommitUseCase"];
  let accountRepo: TestServices["accountRepository"];
  let registrationQuery: TestServices["registrationQuery"];
  let postRepo: TestServices["postRepository"];
  let recordRepo: TestServices["recordRepository"];
  let likeRepo: TestServices["likeRepository"];
  let db: TestServices["db"];
  let ctx: { db: TestServices["db"] };
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    indexCommitUseCase = services.indexCommitUseCase;
    accountRepo = services.accountRepository;
    registrationQuery = services.registrationQuery;
    postRepo = services.postRepository;
    recordRepo = services.recordRepository;
    likeRepo = services.likeRepository;
    db = services.db;
    ctx = { db };
  });

  describe("create/updateオペレーション", () => {
    test("index-1: 作成・更新されたレコードを保存する", async () => {
      // arrange
      const account = accountFactory();
      accountRepo.add(account);

      const registration = registrationFactory({ accountDid: account.did });
      registrationQuery.add(registration);

      const uri = new AtUri(`at://${account.did}/app.bsky.feed.post/123`);
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
        rev: "3aaaaaaaaaaaa",
        record,
      };
      const command: IndexCommitCommand = { commit, live: true };

      // act
      await indexCommitUseCase.execute(command);

      // assert
      const savedPost = await postRepo.find({ ctx, uri });
      expect(savedPost).not.toBeNull();
      expect(savedPost?.uri.toString()).toBe(uri.toString());
      expect(savedPost?.cid).toBe("cid123");
      expect(savedPost?.accountDid).toBe(account.did);
      expect(savedPost?.text).toBe("Hello world");
    });

    test("index-10: レコードの作成者やフォロー先などのアカウントは、すでに保存済みでハンドルと状態が変わらなければ更新しない", async () => {
      // arrange
      const account = accountFactory();
      accountRepo.add(account);
      const saveSpy = vi.spyOn(accountRepo, "save");

      const uri = new AtUri(`at://${account.did}/app.bsky.feed.post/123`);
      const record = Record.create({
        uri,
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          text: "Hello world",
          createdAt: new Date().toISOString(),
        },
      });
      const command: IndexCommitCommand = {
        commit: { operation: "create", uri, rev: "3aaaaaaaaaaaa", record },
        live: true,
      };

      // act
      await indexCommitUseCase.execute(command);

      // assert
      expect(await postRepo.find({ ctx, uri })).not.toBeNull();
      expect(saveSpy).not.toHaveBeenCalled();
    });

    test("index-9: threadgate と postgate は、同じアカウントで同じrkeyの投稿を対象とするものだけ保存する", async () => {
      // arrange
      const account = accountFactory();
      accountRepo.add(account);
      const gate = (collection: string, rkey: string, postRkey: string) => {
        const uri = new AtUri(`at://${account.did}/${collection}/${rkey}`);
        const record = Record.create({
          uri,
          cid: "cid123",
          json: {
            $type: collection,
            post: `at://${account.did}/app.bsky.feed.post/${postRkey}`,
            createdAt: new Date().toISOString(),
          },
        });
        return {
          uri,
          command: {
            commit: {
              operation: "create" as const,
              uri,
              rev: "3aaaaaaaaaaaa",
              record,
            },
            live: true,
          },
        };
      };
      const threadgate = gate("app.bsky.feed.threadgate", "123", "123");
      const postgate = gate("app.bsky.feed.postgate", "123", "123");
      const mismatched = gate("app.bsky.feed.threadgate", "456", "123");

      // act
      await indexCommitUseCase.execute(threadgate.command);
      await indexCommitUseCase.execute(postgate.command);
      await indexCommitUseCase.execute(mismatched.command);

      // assert
      expect(
        await recordRepo.find({ ctx, uri: threadgate.uri }),
      ).not.toBeNull();
      expect(await recordRepo.find({ ctx, uri: postgate.uri })).not.toBeNull();
      expect(await recordRepo.find({ ctx, uri: mismatched.uri })).toBeNull();
    });

    test.each([
      { name: "いいねした人が登録アカウント", liker: true, author: false },
      { name: "投稿の作者が登録アカウント", liker: false, author: true },
      { name: "どちらも登録アカウントでない", liker: false, author: false },
    ])(
      "index-11: いいねは、いいねした人かいいねされた投稿の作者が登録アカウントのものだけ保存する($name)",
      async ({ liker, author }) => {
        // arrange
        const likerAccount = accountFactory();
        const authorAccount = accountFactory();
        if (liker) {
          registrationQuery.add(
            registrationFactory({ accountDid: likerAccount.did }),
          );
        }
        if (author) {
          registrationQuery.add(
            registrationFactory({ accountDid: authorAccount.did }),
          );
        }
        const uri = new AtUri(
          `at://${likerAccount.did}/app.bsky.feed.like/123`,
        );
        const record = Record.create({
          uri,
          cid: "cid123",
          json: {
            $type: "app.bsky.feed.like",
            subject: {
              uri: `at://${authorAccount.did}/app.bsky.feed.post/123`,
              cid: fakeCid(),
            },
            createdAt: new Date().toISOString(),
          },
        });

        // act
        await indexCommitUseCase.execute({
          commit: { operation: "create", uri, rev: "3aaaaaaaaaaaa", record },
          live: true,
        });

        // assert
        expect((await likeRepo.find({ ctx, uri })) !== null).toBe(
          liker || author,
        );
        expect((await recordRepo.find({ ctx, uri })) !== null).toBe(
          liker || author,
        );
      },
    );
  });

  describe("deleteオペレーション", () => {
    test("index-2: 削除されたレコードを削除する", async () => {
      // arrange
      const account = accountFactory();
      accountRepo.add(account);

      const registration = registrationFactory({ accountDid: account.did });
      registrationQuery.add(registration);

      const uri = new AtUri(`at://${account.did}/app.bsky.feed.post/123`);
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
        commit: {
          operation: "create" as const,
          uri,
          rev: "3aaaaaaaaaaaa",
          record,
        },
        live: true,
      };
      await indexCommitUseCase.execute(createCommand);

      const deleteCommand: IndexCommitCommand = {
        commit: { operation: "delete" as const, uri, rev: "3bbbbbbbbbbbb" },
        live: true,
      };

      // act
      await indexCommitUseCase.execute(deleteCommand);

      // assert
      const deletedRecord = await recordRepo.find({ ctx, uri });
      expect(deletedRecord).toBeNull();
    });
  });

  describe("RecordValidationError", () => {
    test("index-3: Lexiconのスキーマに合わないレコードはスキップする", async () => {
      // arrange
      const account = accountFactory();
      accountRepo.add(account);

      const registration = registrationFactory({ accountDid: account.did });
      registrationQuery.add(registration);

      const uri = new AtUri(`at://${account.did}/app.bsky.feed.post/123`);
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
        rev: "3aaaaaaaaaaaa",
        record,
      };
      const command: IndexCommitCommand = { commit, live: true };

      // act
      await indexCommitUseCase.execute(command);

      // assert
      expect(await postRepo.find({ ctx, uri })).toBeNull();
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
        rev: "3aaaaaaaaaaaa",
        record,
      };
      const command: IndexCommitCommand = { commit, live: true };

      // act & assert
      await expect(indexCommitUseCase.execute(command)).rejects.toThrow(
        "Unsupported collection: unsupported.collection",
      );
    });
  });
});
