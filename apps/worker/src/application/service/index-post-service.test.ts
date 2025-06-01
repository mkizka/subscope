import type { TransactionContext } from "@dawn/common/domain";
import { Record } from "@dawn/common/domain";
import {
  connectionPoolFactory,
  databaseFactory,
  LoggerManager,
} from "@dawn/common/infrastructure";
import { schema } from "@dawn/db";
import { eq } from "drizzle-orm";
import { execa } from "execa";
import type { StartedTestContainer } from "testcontainers";
import { GenericContainer } from "testcontainers";
import { createInjector } from "typed-inject";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PostRepository } from "../../infrastructure/post-repository.js";
import { SubscriptionRepository } from "../../infrastructure/subscription-repository.js";
import { IndexPostService } from "./index-post-service.js";

let postgresContainer: StartedTestContainer;
let indexPostService: IndexPostService;
let connectionPool: ReturnType<typeof connectionPoolFactory>;
let ctx: TransactionContext;

beforeAll(async () => {
  postgresContainer = await new GenericContainer("postgres:16-alpine")
    .withEnvironment({ POSTGRES_PASSWORD: "password" })
    .withExposedPorts(5432)
    .start();

  const databaseUrl = new URL(
    `postgresql://${postgresContainer.getHost()}:${postgresContainer.getMappedPort(5432)}`,
  );
  databaseUrl.username = "postgres";
  databaseUrl.password = "password";
  databaseUrl.pathname = "postgres";
  await execa({
    cwd: "../..",
    stdout: "inherit",
    stderr: "inherit",
    env: {
      DATABASE_URL: databaseUrl.toString(),
    },
  })`pnpm db:migrate`;

  const injector = createInjector()
    .provideValue("logLevel", "debug" as const)
    .provideValue("databaseUrl", databaseUrl.toString())
    .provideClass("loggerManager", LoggerManager)
    .provideFactory("connectionPoolFactory", connectionPoolFactory)
    .provideFactory("db", databaseFactory)
    .provideClass("postRepository", PostRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("indexPostService", IndexPostService);

  indexPostService = injector.resolve("indexPostService");
  connectionPool = injector.resolve("connectionPoolFactory");
  ctx = { db: injector.resolve("db") };
});

afterAll(async () => {
  await connectionPool.end();
  await postgresContainer.stop();
});

describe("IndexPostService", () => {
  describe("upsert", () => {
    it("subscriberの投稿は実際にDBに保存される", async () => {
      // subscriberとしてactor情報を準備
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:123",
        handle: "test.bsky.social",
      });

      // subscriptionレコード用のrecordsテーブルエントリ
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:123/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:123",
        json: {
          $type: "dev.mkizka.test.subscription",
          appviewDid: "did:web:api.dawn.test",
          createdAt: new Date().toISOString(),
        },
      });

      await ctx.db.insert(schema.subscriptions).values({
        uri: "at://did:plc:123/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:123",
        appviewDid: "did:web:api.dawn.test",
        createdAt: new Date(),
      });

      // 投稿レコード用のrecordsテーブルエントリ
      const postJson = {
        $type: "app.bsky.feed.post",
        text: "test post",
        createdAt: new Date().toISOString(),
      };
      
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:123/app.bsky.feed.post/123",
        cid: "abc123",
        actorDid: "did:plc:123",
        json: postJson,
      });

      const record = Record.fromJson({
        uri: "at://did:plc:123/app.bsky.feed.post/123",
        cid: "abc123",
        json: postJson,
      });
      await indexPostService.upsert({ ctx, record });
      const [post] = await ctx.db
        .select()
        .from(schema.posts)
        .where(eq(schema.posts.uri, record.uri.toString()))
        .limit(1);
      expect(post).toBeDefined();
    });
  });
});
