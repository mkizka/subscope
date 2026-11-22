import assert from "node:assert";

import { asDid } from "@atproto/did";
import type { LexValue } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";
import type { RecordEvent } from "@atproto/tap";
import { asClassArgs } from "@gyaku/di";
import { InMemoryJobScheduler } from "@repo/common/infrastructure";
import {
  InMemoryDidCache,
  InMemoryDidResolver,
  InMemoryJobQueue,
} from "@repo/common/test";
import { schema } from "@repo/db";
import {
  accountFactory,
  randomCid,
  registrationFactory,
  testSetup,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { InMemoryTapClient } from "../infrastructure/tap-client/tap-client.in-memory.js";
import { createWorkerRegistry } from "../shared/registry.js";
import { testEnv } from "../shared/test-utils.js";
import { indexCommitCommandFactory } from "./tap.js";

// prettier-ignore
const services = await createWorkerRegistry(testEnv)
  .replaceValue("db", testSetup.ctx.db)
  .replaceService("jobQueue", asClassArgs(InMemoryJobQueue))
  .replaceService("jobScheduler", asClassArgs(InMemoryJobScheduler))
  .replaceService("didCache", asClassArgs(InMemoryDidCache))
  .replaceService("didResolver", asClassArgs(InMemoryDidResolver))
  .replaceService("tapClient", asClassArgs(InMemoryTapClient))
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  .replaceValue("syncWorker", {} as never)
  .resolve();

describe("commit", () => {
  const { ctx } = testSetup;
  const processCommit = async (event: RecordEvent) => {
    const command = indexCommitCommandFactory(event);
    assert(command);
    await services.indexCommitUseCase.execute(command);
  };

  const postEvent = (
    did: string,
    action: "create" | "update",
    rev: string,
    text: string,
  ): RecordEvent => ({
    id: 1,
    type: "record",
    action,
    did: asDid(did),
    rev,
    collection: "app.bsky.feed.post",
    rkey: "123",
    cid: "bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm",
    record: {
      $type: "app.bsky.feed.post",
      text,
      createdAt: new Date().toISOString(),
    },
    live: true,
  });

  describe("過去のレコードの期間", () => {
    const DAY = 24 * 60 * 60 * 1000;
    const trackedAt = new Date("2026-01-10T00:00:00.000Z");
    const old = new Date(trackedAt.getTime() - 2 * DAY);
    const recent = new Date(trackedAt.getTime() - DAY / 2);

    test.each([
      { name: "古い投稿", collection: "post", createdAt: old, saved: false },
      {
        name: "古いリポスト",
        collection: "repost",
        createdAt: old,
        saved: false,
      },
      { name: "古いいいね", collection: "like", createdAt: old, saved: false },
      {
        name: "1日前以降の投稿",
        collection: "post",
        createdAt: recent,
        saved: true,
      },
      {
        name: "ライブの古い投稿",
        collection: "post",
        createdAt: old,
        live: true,
        saved: true,
      },
      {
        name: "メンバーの古い投稿",
        collection: "post",
        createdAt: old,
        member: true,
        saved: true,
      },
      {
        name: "追跡の記録がない人の1日前以降の投稿",
        collection: "post",
        createdAt: recent,
        tracked: false,
        saved: false,
      },
    ])(
      "index-19: メンバー以外の過去の投稿・リポスト・いいねは、追跡開始の1日前以降の分だけ保存する($name)",
      async ({
        collection,
        createdAt,
        live = false,
        member = false,
        tracked = true,
        saved,
      }) => {
        // arrange
        const author = await accountFactory(ctx.db).create();
        if (tracked) {
          await ctx.db
            .insert(schema.trackings)
            .values({ accountDid: author.did, trackedAt });
        }
        if (member) {
          await registrationFactory(ctx.db)
            .vars({ account: () => author })
            .create();
        }
        const serverMember = await accountFactory(ctx.db)
          .use((t) => t.serverMember())
          .create();
        const subject = {
          uri: AtUri.make(
            serverMember.did,
            "app.bsky.feed.post",
            "1",
          ).toString(),
          cid: await randomCid(),
        };
        const event: RecordEvent = {
          ...postEvent(author.did, "create", "3aaaaaaaaaaaa", "past"),
          collection: `app.bsky.feed.${collection}`,
          record: {
            $type: `app.bsky.feed.${collection}`,
            ...(collection === "post" ? { text: "past" } : { subject }),
            createdAt: createdAt.toISOString(),
          },
          live,
        };

        // act
        await processCommit(event);

        // assert
        const records = await ctx.db
          .select()
          .from(schema.records)
          .where(eq(schema.records.accountDid, author.did));
        expect(records).toHaveLength(saved ? 1 : 0);
      },
    );
  });

  test("index-15: 投稿のgallery埋め込みの画像を、images埋め込みと区別して保存する", async () => {
    // arrange
    const account = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const imageCid = await randomCid();
    const galleryEmbed = {
      $type: "app.bsky.embed.gallery",
      items: [
        {
          $type: "app.bsky.embed.gallery#image",
          image: {
            $type: "blob",
            ref: { $link: imageCid },
            mimeType: "image/jpeg",
            size: 1000,
          },
          alt: "alt",
          aspectRatio: { width: 4, height: 3 },
        },
      ],
    };
    const embedPostEvent = (rkey: string, embed: LexValue): RecordEvent => ({
      ...postEvent(account.did, "create", "3aaaaaaaaaaaa", "gallery"),
      rkey,
      record: {
        $type: "app.bsky.feed.post",
        text: "gallery",
        embed,
        createdAt: new Date().toISOString(),
      },
    });

    // act
    await processCommit(embedPostEvent("1", galleryEmbed));
    await processCommit(
      embedPostEvent("2", {
        $type: "app.bsky.embed.recordWithMedia",
        record: {
          $type: "app.bsky.embed.record",
          record: {
            uri: AtUri.make(account.did, "app.bsky.feed.post", "1").toString(),
            cid: "bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm",
          },
        },
        media: galleryEmbed,
      }),
    );

    // assert
    const images = await ctx.db
      .select()
      .from(schema.postEmbedImages)
      .orderBy(schema.postEmbedImages.postUri);
    const expected = {
      cid: imageCid,
      position: 0,
      embedType: "gallery",
      alt: "alt",
      aspectRatioWidth: 4,
      aspectRatioHeight: 3,
    };
    expect(images).toEqual([
      {
        ...expected,
        postUri: AtUri.make(account.did, "app.bsky.feed.post", "1").toString(),
      },
      {
        ...expected,
        postUri: AtUri.make(account.did, "app.bsky.feed.post", "2").toString(),
      },
    ]);
  });

  test("index-16: 投稿のvideo埋め込みのメタデータを保存する", async () => {
    // arrange
    const account = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const videoCid = await randomCid();
    const videoEmbed = {
      $type: "app.bsky.embed.video",
      video: {
        $type: "blob",
        ref: { $link: videoCid },
        mimeType: "video/mp4",
        size: 1000,
      },
      alt: "alt",
      aspectRatio: { width: 16, height: 9 },
      presentation: "gif",
    };
    const embedPostEvent = (rkey: string, embed: LexValue): RecordEvent => ({
      ...postEvent(account.did, "create", "3aaaaaaaaaaaa", "video"),
      rkey,
      record: {
        $type: "app.bsky.feed.post",
        text: "video",
        embed,
        createdAt: new Date().toISOString(),
      },
    });

    // act
    await processCommit(embedPostEvent("1", videoEmbed));
    await processCommit(
      embedPostEvent("2", {
        $type: "app.bsky.embed.recordWithMedia",
        record: {
          $type: "app.bsky.embed.record",
          record: {
            uri: AtUri.make(account.did, "app.bsky.feed.post", "1").toString(),
            cid: "bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm",
          },
        },
        media: videoEmbed,
      }),
    );

    // assert
    const videos = await ctx.db
      .select()
      .from(schema.postEmbedVideos)
      .orderBy(schema.postEmbedVideos.postUri);
    const expected = {
      cid: videoCid,
      alt: "alt",
      aspectRatioWidth: 16,
      aspectRatioHeight: 9,
      presentation: "gif",
    };
    expect(videos).toEqual([
      {
        ...expected,
        postUri: AtUri.make(account.did, "app.bsky.feed.post", "1").toString(),
      },
      {
        ...expected,
        postUri: AtUri.make(account.did, "app.bsky.feed.post", "2").toString(),
      },
    ]);
  });
});
