import { AtUri } from "@atproto/syntax";
import { fakeCid } from "@repo/common/test";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { accountFactory } from "../../../domain/account.factory.js";
import { Tracking } from "../../../domain/tracking.js";
import { testRegistry, type TestServices } from "../../../shared/test-utils.js";
import type { IndexCommitCommand } from "./index-commit-command.js";

describe("IndexCommitUseCase", () => {
  let indexCommitUseCase: TestServices["indexCommitUseCase"];
  let accountRepo: TestServices["accountRepository"];
  let registrationQuery: TestServices["registrationQuery"];
  let postRepo: TestServices["postRepository"];
  let recordRepo: TestServices["recordRepository"];
  let likeRepo: TestServices["likeRepository"];
  let trackingRepo: TestServices["trackingRepository"];
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
    trackingRepo = services.trackingRepository;
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

      const uri = new AtUri(`at://${account.did}/app.bsky.feed.post/123`);
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

      const uri = new AtUri(`at://${account.did}/app.bsky.feed.post/123`);
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

    test("index-9: threadgateとpostgateは、同じアカウントの同じrkeyの投稿に付くものだけ保存する", async () => {
      // arrange
      const account = accountFactory();
      accountRepo.add(account);
      const gate = (collection: string, rkey: string, postRkey: string) => {
        const uri = AtUri.make(account.did, collection, rkey);
        const record = {
          uri,
          cid: "cid123",
          json: {
            $type: collection,
            post: AtUri.make(
              account.did,
              "app.bsky.feed.post",
              postRkey,
            ).toString(),
            createdAt: new Date().toISOString(),
          },
          indexedAt: new Date(),
        };
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

    const DAY_MS = 24 * 60 * 60 * 1000;
    const trackedAt = new Date("2026-01-10T00:00:00.000Z");
    const likedPostUri = "at://did:plc:author/app.bsky.feed.post/liked";

    const indexMemberLike = async ({
      live,
      createdAt,
    }: {
      live: boolean;
      createdAt: Date;
    }) => {
      const liker = accountFactory();
      registrationQuery.add(liker.did);
      await trackingRepo.save({
        ctx,
        tracking: Tracking.reconstruct({ did: liker.did, trackedAt }),
      });
      const uri = new AtUri(`at://${liker.did}/app.bsky.feed.like/123`);
      const record = {
        uri,
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.like",
          subject: { uri: likedPostUri, cid: fakeCid() },
          createdAt: createdAt.toISOString(),
        },
        indexedAt: new Date(),
      };
      await indexCommitUseCase.execute({
        commit: { operation: "create", uri, rev: "3aaaaaaaaaaaa", record },
        live,
      });
      return jobScheduler.getFetchRecordJobs().map((job) => job.uri.toString());
    };

    test("index-20: メンバーがいいねした投稿は、保存していなければPDSから取得する", async () => {
      // act
      const fetchUris = await indexMemberLike({
        live: true,
        createdAt: new Date(trackedAt.getTime() - 30 * DAY_MS),
      });

      // assert
      expect(fetchUris).toContain(likedPostUri);
    });

    test.each([
      { name: "1日前ちょうど", offset: -DAY_MS, expected: true },
      { name: "1日前より古い", offset: -DAY_MS - 1, expected: false },
    ])(
      "index-21: メンバーの過去のいいねでは、作成日時が追跡を始めた時刻の1日前より古いものの投稿は取得しない($name)",
      async ({ offset, expected }) => {
        // act
        const fetchUris = await indexMemberLike({
          live: false,
          createdAt: new Date(trackedAt.getTime() + offset),
        });

        // assert
        expect(fetchUris.includes(likedPostUri)).toBe(expected);
      },
    );
  });

  describe("集計ジョブ", () => {
    const indexMemberRecord = async (
      collection: string,
      json: { [key: string]: unknown },
    ) => {
      const member = accountFactory();
      accountRepo.add(member);
      registrationQuery.add(member.did);
      const uri = AtUri.make(member.did, collection, "123");
      const record = {
        uri,
        cid: "cid123",
        json: {
          $type: collection,
          createdAt: new Date().toISOString(),
          ...json,
        },
        indexedAt: new Date(),
      };
      await indexCommitUseCase.execute({
        commit: { operation: "create", uri, rev: "3aaaaaaaaaaaa", record },
        live: true,
      });
      return { member, uri };
    };
    const postStatsUris = () =>
      jobScheduler.getAggregatePostStatsUris().map((uri) => uri.toString());

    test("投稿を保存した場合、投稿・返信先・引用元の投稿と作者の集計ジョブを積む", async () => {
      // arrange
      const parent = {
        uri: "at://did:plc:other/app.bsky.feed.post/parent",
        cid: fakeCid(),
      };
      const quoted = {
        uri: "at://did:plc:other/app.bsky.feed.post/quoted",
        cid: fakeCid(),
      };

      // act
      const { member, uri } = await indexMemberRecord("app.bsky.feed.post", {
        text: "reply",
        reply: { root: parent, parent },
        embed: { $type: "app.bsky.embed.record", record: quoted },
      });

      // assert
      expect(postStatsUris()).toEqual(
        expect.arrayContaining([uri.toString(), parent.uri, quoted.uri]),
      );
      expect(jobScheduler.getAggregateAccountStatsDids()).toContain(member.did);
    });

    test.each(["app.bsky.feed.like", "app.bsky.feed.repost"])(
      "%sを保存した場合、対象の投稿の集計ジョブを積む",
      async (collection) => {
        // arrange
        const subject = {
          uri: "at://did:plc:other/app.bsky.feed.post/1",
          cid: fakeCid(),
        };

        // act
        await indexMemberRecord(collection, { subject });

        // assert
        expect(postStatsUris()).toContain(subject.uri);
      },
    );

    test("フォローを保存した場合、フォローした人とされた人の集計ジョブを積む", async () => {
      // arrange
      const subject = accountFactory();

      // act
      const { member } = await indexMemberRecord("app.bsky.graph.follow", {
        subject: subject.did,
      });

      // assert
      expect(jobScheduler.getAggregateAccountStatsDids()).toEqual(
        expect.arrayContaining([member.did, subject.did]),
      );
    });

    test("保存済みのいいねを削除した場合、対象の投稿の集計ジョブを積む", async () => {
      // arrange
      const subject = {
        uri: "at://did:plc:other/app.bsky.feed.post/1",
        cid: fakeCid(),
      };
      const { uri } = await indexMemberRecord("app.bsky.feed.like", {
        subject,
      });
      jobScheduler.clear();

      // act
      await indexCommitUseCase.execute({
        commit: { operation: "delete", uri, rev: "3bbbbbbbbbbbb" },
        live: true,
      });

      // assert
      expect(postStatsUris()).toContain(subject.uri);
    });
  });

  describe("取得ジョブ", () => {
    test.each([
      { name: "ライブ", live: true },
      { name: "バックフィル", live: false },
    ])(
      "index-12: バックフィルのレコードから積むジョブは、ライブのものより低い優先度で積む($name)",
      async ({ live }) => {
        // arrange
        const member = accountFactory();
        accountRepo.add(member);
        registrationQuery.add(member.did);
        const quotedUri = "at://did:plc:other/app.bsky.feed.post/quoted";
        const uri = AtUri.make(member.did, "app.bsky.feed.post", "123");
        const record = {
          uri,
          cid: "cid123",
          json: {
            $type: "app.bsky.feed.post",
            text: "quote",
            embed: {
              $type: "app.bsky.embed.record",
              record: { uri: quotedUri, cid: fakeCid() },
            },
            createdAt: new Date().toISOString(),
          },
          indexedAt: new Date(),
        };

        // act
        await indexCommitUseCase.execute({
          commit: { operation: "create", uri, rev: "3aaaaaaaaaaaa", record },
          live,
        });

        // assert
        const job = jobScheduler
          .getFetchRecordJobs()
          .find((job) => job.uri.toString() === quotedUri);
        expect(job).toMatchObject({ live, depth: 0 });
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

      const uri = new AtUri(`at://${account.did}/app.bsky.feed.post/123`);
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

      const uri = new AtUri(`at://${account.did}/app.bsky.feed.post/123`);
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
