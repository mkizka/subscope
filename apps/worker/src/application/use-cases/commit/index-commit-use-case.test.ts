import { AtUri } from "@atproto/syntax";
import { fakeCid } from "@repo/common/test";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { accountFactory } from "../../../domain/account.factory.js";
import { postFactory } from "../../../domain/post.factory.js";
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

    test("index-18: 保存した返信の返信先と起点の投稿は、保存していなければPDSから取得する", async () => {
      // arrange
      const account = accountFactory();
      accountRepo.add(account);
      registrationQuery.add(account.did);
      const parentUri = "at://did:plc:parent/app.bsky.feed.post/parent";
      const rootUri = "at://did:plc:root/app.bsky.feed.post/root";
      const uri = new AtUri(`at://${account.did}/app.bsky.feed.post/reply`);
      const record = {
        uri,
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          text: "reply",
          reply: {
            parent: { uri: parentUri, cid: fakeCid() },
            root: { uri: rootUri, cid: fakeCid() },
          },
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

      // act
      await indexCommitUseCase.execute({ commit, live: true });

      // assert
      expect(
        jobScheduler.getFetchRecordJobs().map((job) => job.uri.toString()),
      ).toEqual(expect.arrayContaining([parentUri, rootUri]));
    });

    test("index-10: 保存済みのアカウントは、ハンドルと状態が変わらなければ更新しない", async () => {
      // arrange
      const account = accountFactory();
      registrationQuery.add(account.did);
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

    const postOf = (did: string) => {
      const uri = AtUri.make(did, "app.bsky.feed.post", "123");
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
      return {
        commit: {
          operation: "create" as const,
          uri,
          rev: "3aaaaaaaaaaaa",
          record,
        },
        live: true,
      };
    };

    const threadgateOf = (did: string) => {
      const uri = AtUri.make(did, "app.bsky.feed.threadgate", "123");
      const record = {
        uri,
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.threadgate",
          post: AtUri.make(did, "app.bsky.feed.post", "123").toString(),
          createdAt: new Date().toISOString(),
        },
        indexedAt: new Date(),
      };
      return {
        commit: {
          operation: "create" as const,
          uri,
          rev: "3aaaaaaaaaaaa",
          record,
        },
        live: true,
      };
    };

    test("index-9: threadgateとpostgateは、同じアカウントの同じrkeyの投稿に付くものだけ保存する", async () => {
      // arrange
      const account = accountFactory();
      registrationQuery.add(account.did);
      accountRepo.add(account);
      const gate = ({
        collection,
        rkey,
        postRkey,
      }: {
        collection: string;
        rkey: string;
        postRkey: string;
      }) => {
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
      const threadgate = gate({
        collection: "app.bsky.feed.threadgate",
        rkey: "123",
        postRkey: "123",
      });
      const postgate = gate({
        collection: "app.bsky.feed.postgate",
        rkey: "123",
        postRkey: "123",
      });
      const mismatched = gate({
        collection: "app.bsky.feed.threadgate",
        rkey: "456",
        postRkey: "123",
      });
      await indexCommitUseCase.execute(postOf(account.did));

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

    test("index-25: threadgateとpostgateは、対象の投稿を保存済みのときだけ保存する", async () => {
      // arrange
      const account = accountFactory();
      accountRepo.add(account);
      const threadgate = threadgateOf(account.did);

      // act
      await indexCommitUseCase.execute(threadgate);

      // assert
      expect(
        await recordRepo.find({ ctx, uri: threadgate.commit.uri }),
      ).toBeNull();
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

    test.each([
      { name: "保存していない", saved: false },
      { name: "保存している", saved: true },
    ])(
      "fetchRecord-7: Tapから受け取ったプロフィールが指す固定投稿を、保存していなければ取得する($name)",
      async ({ saved }) => {
        // arrange
        const account = accountFactory();
        registrationQuery.add(account.did);
        const pinnedUri = `at://${account.did}/app.bsky.feed.post/pinned`;
        if (saved) {
          recordRepo.add(postFactory({ uri: pinnedUri }).record);
        }
        const uri = new AtUri(
          `at://${account.did}/app.bsky.actor.profile/self`,
        );
        const record = {
          uri,
          cid: "cid123",
          json: {
            $type: "app.bsky.actor.profile",
            pinnedPost: { uri: pinnedUri, cid: fakeCid() },
          },
          indexedAt: new Date(),
        };

        // act
        await indexCommitUseCase.execute({
          commit: { operation: "create", uri, rev: "3aaaaaaaaaaaa", record },
          live: false,
        });

        // assert
        expect(
          jobScheduler
            .getFetchRecordJobs()
            .filter((job) => job.uri.toString() === pinnedUri),
        ).toMatchObject(saved ? [] : [{ live: false, depth: 0 }]);
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

    const memberPost = (did: string) => ({
      uri: `at://${did}/app.bsky.feed.post/1`,
      cid: fakeCid(),
    });

    test.each([
      {
        name: "返信先の作者がメンバー",
        collection: "app.bsky.feed.post",
        json: (member: string, other: string) => ({
          text: "reply",
          reply: { parent: memberPost(member), root: memberPost(other) },
        }),
        saved: true,
      },
      {
        name: "起点の作者がメンバー",
        collection: "app.bsky.feed.post",
        json: (member: string, other: string) => ({
          text: "reply",
          reply: { parent: memberPost(other), root: memberPost(member) },
        }),
        saved: true,
      },
      {
        name: "引用元の作者がメンバー",
        collection: "app.bsky.feed.post",
        json: (member: string) => ({
          text: "quote",
          embed: { $type: "app.bsky.embed.record", record: memberPost(member) },
        }),
        saved: true,
      },
      {
        name: "メンションの相手がメンバー",
        collection: "app.bsky.feed.post",
        json: (member: string) => ({
          text: "@member",
          facets: [
            {
              index: { byteStart: 0, byteEnd: 7 },
              features: [
                { $type: "app.bsky.richtext.facet#mention", did: member },
              ],
            },
          ],
        }),
        saved: true,
      },
      {
        name: "メンバー宛てでない投稿",
        collection: "app.bsky.feed.post",
        json: (_: string, other: string) => ({
          text: "reply",
          reply: { parent: memberPost(other), root: memberPost(other) },
        }),
        saved: false,
      },
      {
        name: "リポストの対象の作者がメンバー",
        collection: "app.bsky.feed.repost",
        json: (member: string) => ({ subject: memberPost(member) }),
        saved: true,
      },
      {
        name: "メンバー宛てでないリポスト",
        collection: "app.bsky.feed.repost",
        json: (_: string, other: string) => ({ subject: memberPost(other) }),
        saved: false,
      },
      {
        name: "フォローの相手がメンバー",
        collection: "app.bsky.graph.follow",
        json: (member: string) => ({ subject: member }),
        saved: true,
      },
      {
        name: "メンバー宛てでないフォロー",
        collection: "app.bsky.graph.follow",
        json: (_: string, other: string) => ({ subject: other }),
        saved: false,
      },
      {
        name: "宛先を持たないプロフィール",
        collection: "app.bsky.actor.profile",
        json: () => ({ displayName: "other" }),
        saved: false,
      },
    ])(
      "index-28: 追跡アカウントでないアカウントのレコードは、メンバー宛てのものだけ保存する($name)",
      async ({ collection, json, saved }) => {
        // arrange
        const author = accountFactory();
        const member = accountFactory();
        const other = accountFactory();
        registrationQuery.add(member.did);
        const uri = AtUri.make(author.did, collection, "123");
        const record = {
          uri,
          cid: "cid123",
          json: {
            $type: collection,
            ...json(member.did, other.did),
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
        expect((await recordRepo.find({ ctx, uri })) !== null).toBe(saved);
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
        } else {
          registrationQuery.addFollowed(author.did);
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
  });
});
