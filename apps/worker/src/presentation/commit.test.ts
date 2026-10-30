import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { asClassArgs } from "@gyaku/di";
import type { CommitEventDto } from "@repo/common/domain";
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

import { indexCommitCommandFactory } from "../application/use-cases/commit/index-commit-command.js";
import { InMemoryJobLogger } from "../shared/job-logger.in-memory.js";
import { createWorkerRegistry } from "../shared/registry.js";
import { testEnv } from "../shared/test-utils.js";

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
  const processCommit = (event: CommitEventDto) =>
    services.indexCommitUseCase.execute(
      indexCommitCommandFactory({ event, jobLogger: new InMemoryJobLogger() }),
    );

  const deleteEvent = (did: string, rev: string): CommitEventDto => ({
    did: asDid(did),
    live: true,
    commit: {
      operation: "delete",
      collection: "app.bsky.feed.post",
      rkey: "123",
      rev,
    },
  });

  const postEvent = (
    did: string,
    operation: "create" | "update",
    rev: string | undefined,
    text: string,
  ): CommitEventDto => ({
    did: asDid(did),
    live: true,
    commit: {
      operation,
      collection: "app.bsky.feed.post",
      rkey: "123",
      rev,
      cid: "bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm",
      record: {
        $type: "app.bsky.feed.post",
        text,
        createdAt: new Date().toISOString(),
      },
    },
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

  test("index-7: revを持たないコミットは、revを比べずに処理する", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    await processCommit(deleteEvent(actor.did, "3bbbbbbbbbbbb"));

    // act
    await processCommit(postEvent(actor.did, "create", undefined, "new"));

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
});
