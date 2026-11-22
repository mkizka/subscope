import { AtUri } from "@atproto/syntax";
import { fakeCid } from "@repo/common/test";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { accountFactory } from "../../../domain/account.factory.js";
import { testRegistry, type TestServices } from "../../../shared/test-utils.js";
import type { IndexCommitCommand } from "./index-commit-command.js";

describe("IndexCommitUseCase", () => {
  let indexCommitUseCase: TestServices["indexCommitUseCase"];
  let accountRepo: TestServices["accountRepository"];
  let registrationQuery: TestServices["registrationQuery"];
  let postRepo: TestServices["postRepository"];
  let recordRepo: TestServices["recordRepository"];
  let likeRepo: TestServices["likeRepository"];
  let jobScheduler: TestServices["jobScheduler"];
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
    jobScheduler = services.jobScheduler;
    db = services.db;
    ctx = { db };
  });

  describe("create/updateオペレーション", () => {
    test("index-1: 作成・更新されたレコードを保存する", async () => {
      // arrange
      const account = accountFactory();
      accountRepo.add(account);

      registrationQuery.add(account.did);

      const uri = AtUri.make(account.did, "app.bsky.feed.post", "123");
      const record = {
        uri,
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          text: "Hello world",
          createdAt: new Date().toISOString(),
        },
        indexedAt: new Date(),
      };
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

    test("index-10: 保存済みのアカウントは、ハンドルと状態が変わらなければ更新しない", async () => {
      // arrange
      const account = accountFactory();
      accountRepo.add(account);
      const saveSpy = vi.spyOn(accountRepo, "save");

      const uri = AtUri.make(account.did, "app.bsky.feed.post", "123");
      const record = {
        uri,
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          text: "Hello world",
          createdAt: new Date().toISOString(),
        },
        indexedAt: new Date(),
      };
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

    describe("threadgateとpostgate", () => {
      const setup = () => {
        const account = accountFactory();
        accountRepo.add(account);
        registrationQuery.add(account.did);
        const post = {
          uri: AtUri.make(account.did, "app.bsky.feed.post", "123"),
          cid: "cid123",
          json: {
            $type: "app.bsky.feed.post",
            text: "Hello world",
            createdAt: new Date().toISOString(),
          },
          indexedAt: new Date(),
        };
        const gate = (collection: string, rkey: string) => {
          const uri = AtUri.make(account.did, collection, rkey);
          return {
            uri,
            cid: "cid123",
            json: {
              $type: collection,
              post: post.uri.toString(),
              createdAt: new Date().toISOString(),
            },
            indexedAt: new Date(),
          };
        };
        return { post, gate };
      };
      const create = (record: {
        uri: AtUri;
        cid: string;
        json: object;
        indexedAt: Date;
      }) =>
        indexCommitUseCase.execute({
          commit: {
            operation: "create",
            uri: record.uri,
            rev: "3aaaaaaaaaaaa",
            record,
          },
          live: false,
        });

      test("index-9: threadgateとpostgateは、同じアカウントの同じrkeyの投稿に付くものだけ保存する", async () => {
        // arrange
        const { post, gate } = setup();
        const mismatched = gate("app.bsky.feed.threadgate", "456");
        await create(post);

        // act
        await create(mismatched);

        // assert
        expect(await recordRepo.find({ ctx, uri: mismatched.uri })).toBeNull();
      });

      test("index-18: threadgateとpostgateは、対象の投稿を保存済みのときだけ保存する", async () => {
        // arrange
        const { post, gate } = setup();
        const threadgate = gate("app.bsky.feed.threadgate", "123");
        const postgate = gate("app.bsky.feed.postgate", "123");

        // act
        await create(threadgate);
        await create(post);
        await create(postgate);

        // assert
        expect(await recordRepo.find({ ctx, uri: threadgate.uri })).toBeNull();
        expect(
          await recordRepo.find({ ctx, uri: postgate.uri }),
        ).not.toBeNull();
      });

      test("index-20: 対象の投稿より先に届いたthreadgateとpostgateは、PDSから取り直して保存する", async () => {
        // arrange
        const { gate } = setup();
        const threadgate = gate("app.bsky.feed.threadgate", "123");

        // act
        await create(threadgate);

        // assert
        expect(jobScheduler.getFetchRecordJobs()).toMatchObject([
          { uri: threadgate.uri, live: false, depth: 0 },
        ]);
      });
    });

    test.each([
      { name: "いいねした人がメンバー", liker: true, author: false },
      { name: "投稿の作者がメンバー", liker: false, author: true },
      { name: "どちらもメンバーでない", liker: false, author: false },
    ])(
      "index-11: いいねは、いいねした人かいいねされた投稿の作者がメンバーのものだけ保存する($name)",
      async ({ liker, author }) => {
        // arrange
        const likerAccount = accountFactory();
        const authorAccount = accountFactory();
        if (liker) {
          registrationQuery.add(likerAccount.did);
        }
        if (author) {
          registrationQuery.add(authorAccount.did);
        }
        const uri = new AtUri(
          `at://${likerAccount.did}/app.bsky.feed.like/123`,
        );
        const record = {
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
          indexedAt: new Date(),
        };

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

  describe("フォロー・リスト項目の相手", () => {
    test.each([
      { collection: "app.bsky.graph.follow", member: true },
      { collection: "app.bsky.graph.follow", member: false },
      { collection: "app.bsky.graph.listitem", member: true },
      { collection: "app.bsky.graph.listitem", member: false },
    ])(
      "index-17: フォローとリスト項目の相手のプロフィールとハンドルは、メンバーの分だけ取る($collection, メンバー=$member)",
      async ({ collection, member }) => {
        // arrange
        const author = accountFactory();
        accountRepo.add(author);
        const subject = accountFactory();
        if (member) {
          registrationQuery.add(author.did);
        }
        const uri = AtUri.make(author.did, collection, "123");
        const record = {
          uri,
          cid: "cid123",
          json: {
            $type: collection,
            subject: subject.did,
            list: `at://${author.did}/app.bsky.graph.list/123`,
            createdAt: new Date().toISOString(),
          },
          indexedAt: new Date(),
        };

        // act
        await indexCommitUseCase.execute({
          commit: { operation: "create", uri, rev: "3aaaaaaaaaaaa", record },
          live: true,
        });

        // assert
        expect(
          await accountRepo.find({ ctx, did: subject.did }),
        ).not.toBeNull();
        expect(
          jobScheduler
            .getResolveDidJobs()
            .some((job) => job.did === subject.did),
        ).toBe(member);
        expect(
          jobScheduler
            .getFetchRecordJobs()
            .some((job) => job.uri.host === subject.did),
        ).toBe(member);
      },
    );
  });

  describe("deleteオペレーション", () => {
    test("index-2: 削除されたレコードを削除する", async () => {
      // arrange
      const account = accountFactory();
      accountRepo.add(account);

      registrationQuery.add(account.did);

      const uri = AtUri.make(account.did, "app.bsky.feed.post", "123");
      const record = {
        uri,
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          text: "To be deleted",
          createdAt: new Date().toISOString(),
        },
        indexedAt: new Date(),
      };
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
    test("index-3: スキーマに合わないレコードは保存しない", async () => {
      // arrange
      const account = accountFactory();
      accountRepo.add(account);

      registrationQuery.add(account.did);

      const uri = AtUri.make(account.did, "app.bsky.feed.post", "123");
      const record = {
        uri,
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          // createdAtがないため、バリデーションエラーになる想定
        },
        indexedAt: new Date(),
      };
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
      const record = {
        uri,
        cid: "cid123",
        json: {
          $type: "unsupported.collection",
          text: "Hello world",
        },
        indexedAt: new Date(),
      };
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
