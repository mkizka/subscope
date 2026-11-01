import assert from "node:assert";

import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { RecordEvent } from "@atproto/tap";
import { asClassArgs } from "@gyaku/di";
import { InMemoryJobScheduler } from "@repo/common/infrastructure";
import {
  InMemoryDidCache,
  InMemoryDidResolver,
  InMemoryJobQueue,
  InMemoryTapClient,
} from "@repo/common/test";
import { schema } from "@repo/db";
import { actorFactory, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

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

  const deleteEvent = (did: string, rev: string): RecordEvent => ({
    id: 1,
    type: "record",
    action: "delete",
    did: asDid(did),
    rev,
    collection: "app.bsky.feed.post",
    rkey: "123",
    live: true,
  });

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

  const findPost = async (did: string) => {
    const uri = AtUri.make(did, "app.bsky.feed.post", "123").toString();
    const [post] = await ctx.db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.uri, uri));
    return post ?? null;
  };

  test("index-5: 削除したレコードは、削除より古いrevのコミットで復活させない", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    await processCommit(deleteEvent(actor.did, "3bbbbbbbbbbbb"));

    // act
    await processCommit(postEvent(actor.did, "create", "3aaaaaaaaaaaa", "old"));

    // assert
    expect(await findPost(actor.did)).toBeNull();
  });

  test("index-6: 更新したレコードは、更新より古いrevのコミットで古い内容に戻さない", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    await processCommit(postEvent(actor.did, "update", "3bbbbbbbbbbbb", "new"));

    // act
    await processCommit(postEvent(actor.did, "create", "3aaaaaaaaaaaa", "old"));

    // assert
    expect((await findPost(actor.did))?.text).toBe("new");
  });

  test("index-8: 処理済みのrevと同じrevのコミットは、もう一度処理する", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    await processCommit(postEvent(actor.did, "create", "3aaaaaaaaaaaa", "old"));

    // act
    await processCommit(postEvent(actor.did, "create", "3aaaaaaaaaaaa", "new"));

    // assert
    expect((await findPost(actor.did))?.text).toBe("new");
  });

  test("index-14: 保存しないレコードのコミットは、revを記録しない", async () => {
    // arrange
    const liker = await actorFactory(ctx.db).create();
    const uri = AtUri.make(liker.did, "app.bsky.feed.like", "123");

    // act
    await processCommit({
      id: 1,
      type: "record",
      action: "create",
      did: asDid(liker.did),
      rev: "3aaaaaaaaaaaa",
      collection: "app.bsky.feed.like",
      rkey: "123",
      cid: "bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm",
      record: {
        $type: "app.bsky.feed.like",
        subject: {
          uri: `at://${liker.did}/app.bsky.feed.post/123`,
          cid: "bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm",
        },
        createdAt: new Date().toISOString(),
      },
      live: true,
    });

    // assert
    const revs = await ctx.db
      .select()
      .from(schema.recordRevs)
      .where(eq(schema.recordRevs.uri, uri.toString()));
    expect(revs).toEqual([]);
  });
});
