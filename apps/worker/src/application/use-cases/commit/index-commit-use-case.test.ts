import { AtUri } from "@atproto/syntax";
import { Record } from "@repo/common/domain";
import { actorFactory, fakeCid, subscriptionFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";
import type { IndexCommitCommand } from "./index-commit-command.js";

describe("IndexCommitUseCase", () => {
  let indexCommitUseCase: TestServices["indexCommitUseCase"];
  let actorRepo: TestServices["actorRepository"];
  let subscriptionRepo: TestServices["subscriptionRepository"];
  let postRepo: TestServices["postRepository"];
  let recordRepo: TestServices["recordRepository"];
  let likeRepo: TestServices["likeRepository"];
  let db: TestServices["db"];
  let ctx: { db: TestServices["db"] };
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    indexCommitUseCase = services.indexCommitUseCase;
    actorRepo = services.actorRepository;
    subscriptionRepo = services.subscriptionRepository;
    postRepo = services.postRepository;
    recordRepo = services.recordRepository;
    likeRepo = services.likeRepository;
    db = services.db;
    ctx = { db };
  });

  const jobLogger = { log: vi.fn() };

  describe("create/updateオペレーション", () => {
    test("index-1: 作成・更新されたレコードを保存する", async () => {
      // arrange
      const actor = actorFactory();
      actorRepo.add(actor);

      const subscription = subscriptionFactory({ actorDid: actor.did });
      subscriptionRepo.add(subscription);

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
        rev: "3aaaaaaaaaaaa",
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

      const savedPost = postRepo.findByUri(uri);
      expect(savedPost).not.toBeNull();
      expect(savedPost?.uri.toString()).toBe(uri.toString());
      expect(savedPost?.cid).toBe("cid123");
      expect(savedPost?.actorDid).toBe(actor.did);
      expect(savedPost?.text).toBe("Hello world");
    });

    test("index-10: レコードの作成者やフォロー先などのアクターは、すでに保存済みでハンドルと状態が変わらなければ更新しない", async () => {
      // arrange
      const actor = actorFactory();
      actorRepo.add(actor);
      const upsertSpy = vi.spyOn(actorRepo, "upsert");

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
      const command: IndexCommitCommand = {
        commit: { operation: "create", uri, rev: "3aaaaaaaaaaaa", record },
        live: true,
        jobLogger,
      };

      // act
      await indexCommitUseCase.execute(command);

      // assert
      expect(postRepo.findByUri(uri)).not.toBeNull();
      expect(upsertSpy).not.toHaveBeenCalled();
    });

    test("index-9: threadgate と postgate は、同じアカウントで同じrkeyの投稿を対象とするものだけ保存する", async () => {
      // arrange
      const actor = actorFactory();
      actorRepo.add(actor);
      const gate = (collection: string, rkey: string, postRkey: string) => {
        const uri = new AtUri(`at://${actor.did}/${collection}/${rkey}`);
        const record = Record.create({
          uri,
          cid: "cid123",
          json: {
            $type: collection,
            post: `at://${actor.did}/app.bsky.feed.post/${postRkey}`,
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
            jobLogger,
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
        await recordRepo.findByUri({ ctx, uri: threadgate.uri }),
      ).not.toBeNull();
      expect(
        await recordRepo.findByUri({ ctx, uri: postgate.uri }),
      ).not.toBeNull();
      expect(
        await recordRepo.findByUri({ ctx, uri: mismatched.uri }),
      ).toBeNull();
      expect(jobLogger.log).toHaveBeenCalledWith(
        "Indexing completed successfully.",
      );
    });

    test.each([
      { name: "いいねした人がサブスクライバー", liker: true, author: false },
      { name: "投稿の作者がサブスクライバー", liker: false, author: true },
      { name: "どちらもサブスクライバーでない", liker: false, author: false },
    ])(
      "index-11: いいねは、いいねした人かいいねされた投稿の作者がサブスクライバーのものだけ保存する($name)",
      async ({ liker, author }) => {
        // arrange
        const likerActor = actorFactory();
        const authorActor = actorFactory();
        if (liker) {
          subscriptionRepo.add(
            subscriptionFactory({ actorDid: likerActor.did }),
          );
        }
        if (author) {
          subscriptionRepo.add(
            subscriptionFactory({ actorDid: authorActor.did }),
          );
        }
        const uri = new AtUri(`at://${likerActor.did}/app.bsky.feed.like/123`);
        const record = Record.create({
          uri,
          cid: "cid123",
          json: {
            $type: "app.bsky.feed.like",
            subject: {
              uri: `at://${authorActor.did}/app.bsky.feed.post/123`,
              cid: fakeCid(),
            },
            createdAt: new Date().toISOString(),
          },
        });

        // act
        await indexCommitUseCase.execute({
          commit: { operation: "create", uri, rev: "3aaaaaaaaaaaa", record },
          live: true,
          jobLogger,
        });

        // assert
        expect(likeRepo.findByUri(uri) !== null).toBe(liker || author);
        expect((await recordRepo.findByUri({ ctx, uri })) !== null).toBe(
          liker || author,
        );
        expect(jobLogger.log).toHaveBeenCalledWith(
          "Indexing completed successfully.",
        );
      },
    );
  });

  describe("deleteオペレーション", () => {
    test("index-2: 削除されたレコードを削除する", async () => {
      // arrange
      const actor = actorFactory();
      actorRepo.add(actor);

      const subscription = subscriptionFactory({ actorDid: actor.did });
      subscriptionRepo.add(subscription);

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
        commit: {
          operation: "create" as const,
          uri,
          rev: "3aaaaaaaaaaaa",
          record,
        },
        live: true,
        jobLogger,
      };
      await indexCommitUseCase.execute(createCommand);

      const deleteCommand: IndexCommitCommand = {
        commit: { operation: "delete" as const, uri, rev: "3bbbbbbbbbbbb" },
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

      const deletedRecord = await recordRepo.findByUri({ ctx, uri });
      expect(deletedRecord).toBeNull();
    });
  });

  describe("RecordValidationError", () => {
    test("index-3: Lexiconのスキーマに合わないレコードはジョブを失敗させずにスキップする", async () => {
      // arrange
      const actor = actorFactory();
      actorRepo.add(actor);

      const subscription = subscriptionFactory({ actorDid: actor.did });
      subscriptionRepo.add(subscription);

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
        rev: "3aaaaaaaaaaaa",
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
      const command: IndexCommitCommand = { commit, live: true, jobLogger };

      // act & assert
      await expect(indexCommitUseCase.execute(command)).rejects.toThrow(
        "Unsupported collection: unsupported.collection",
      );
    });
  });
});
