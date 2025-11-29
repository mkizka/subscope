import { schema } from "@repo/db";
import {
  actorFactory,
  inviteCodeFactory,
  subscriptionFactory,
  testSetup,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { InviteCodeRepository } from "../../../infrastructure/invite-code-repository/invite-code-repository.js";
import { InviteCodeService } from "../../service/admin/invite-code-service.js";
import { GetInviteCodesUseCase } from "./get-invite-codes-use-case.js";

describe("GetInviteCodesUseCase", () => {
  const { testInjector, ctx } = testSetup;

  const getInviteCodesUseCase = testInjector
    .provideClass("inviteCodeRepository", InviteCodeRepository)
    .provideClass("inviteCodeService", InviteCodeService)
    .injectClass(GetInviteCodesUseCase);

  test("招待コードが存在する場合、招待コード一覧を返す", async () => {
    // arrange
    const inviteCode1 = await inviteCodeFactory(ctx.db)
      .props({
        createdAt: () => new Date("2024-01-01T00:00:00.000Z"),
        expiresAt: () => new Date("2024-01-08T00:00:00.000Z"),
      })
      .create();

    const inviteCode2 = await inviteCodeFactory(ctx.db)
      .props({
        createdAt: () => new Date("2024-01-02T00:00:00.000Z"),
        expiresAt: () => new Date("2024-01-09T00:00:00.000Z"),
      })
      .create();

    // act
    const result = await getInviteCodesUseCase.execute({
      limit: 50,
    });

    // assert
    expect(result).toEqual({
      codes: [
        {
          code: inviteCode2.code,
          expiresAt: inviteCode2.expiresAt.toISOString(),
          createdAt: inviteCode2.createdAt.toISOString(),
          usedAt: undefined,
          usedBy: undefined,
        },
        {
          code: inviteCode1.code,
          expiresAt: inviteCode1.expiresAt.toISOString(),
          createdAt: inviteCode1.createdAt.toISOString(),
          usedAt: undefined,
          usedBy: undefined,
        },
      ],
      cursor: undefined,
    });
  });

  test("limitを指定した場合、指定した件数の招待コードを返す", async () => {
    // arrange
    await inviteCodeFactory(ctx.db)
      .props({
        createdAt: () => new Date("2024-01-01T00:00:00.000Z"),
      })
      .create();
    const inviteCode2 = await inviteCodeFactory(ctx.db)
      .props({
        createdAt: () => new Date("2024-01-02T00:00:00.000Z"),
      })
      .create();
    const inviteCode3 = await inviteCodeFactory(ctx.db)
      .props({
        createdAt: () => new Date("2024-01-03T00:00:00.000Z"),
      })
      .create();

    // act
    const result = await getInviteCodesUseCase.execute({
      limit: 2,
    });

    // assert
    expect(result).toEqual({
      codes: [
        {
          code: inviteCode3.code,
          expiresAt: inviteCode3.expiresAt.toISOString(),
          createdAt: inviteCode3.createdAt.toISOString(),
          usedAt: undefined,
          usedBy: undefined,
        },
        {
          code: inviteCode2.code,
          expiresAt: inviteCode2.expiresAt.toISOString(),
          createdAt: inviteCode2.createdAt.toISOString(),
          usedAt: undefined,
          usedBy: undefined,
        },
      ],
      cursor: inviteCode2.createdAt.toISOString(),
    });
  });

  test("cursorを指定した場合、cursorより古い招待コードを返す", async () => {
    // arrange
    const inviteCode1 = await inviteCodeFactory(ctx.db)
      .props({
        createdAt: () => new Date("2024-01-01T00:00:00.000Z"),
      })
      .create();
    const inviteCode2 = await inviteCodeFactory(ctx.db)
      .props({
        createdAt: () => new Date("2024-01-02T00:00:00.000Z"),
      })
      .create();
    await inviteCodeFactory(ctx.db)
      .props({
        createdAt: () => new Date("2024-01-03T00:00:00.000Z"),
      })
      .create();

    // act
    const result = await getInviteCodesUseCase.execute({
      limit: 50,
      cursor: inviteCode2.createdAt.toISOString(),
    });

    // assert
    expect(result).toEqual({
      codes: [
        {
          code: inviteCode1.code,
          expiresAt: inviteCode1.expiresAt.toISOString(),
          createdAt: inviteCode1.createdAt.toISOString(),
          usedAt: undefined,
          usedBy: undefined,
        },
      ],
      cursor: undefined,
    });
  });

  test("複数ページのデータがある場合、ページネーションが正しく動作する", async () => {
    // arrange
    const inviteCode1 = await inviteCodeFactory(ctx.db)
      .props({
        createdAt: () => new Date("2024-01-01T00:00:00.000Z"),
      })
      .create();
    const inviteCode2 = await inviteCodeFactory(ctx.db)
      .props({
        createdAt: () => new Date("2024-01-02T00:00:00.000Z"),
      })
      .create();
    const inviteCode3 = await inviteCodeFactory(ctx.db)
      .props({
        createdAt: () => new Date("2024-01-03T00:00:00.000Z"),
      })
      .create();
    const inviteCode4 = await inviteCodeFactory(ctx.db)
      .props({
        createdAt: () => new Date("2024-01-04T00:00:00.000Z"),
      })
      .create();

    // act - 1ページ目
    const page1 = await getInviteCodesUseCase.execute({
      limit: 2,
    });

    // assert
    expect(page1).toEqual({
      codes: [
        {
          code: inviteCode4.code,
          expiresAt: inviteCode4.expiresAt.toISOString(),
          createdAt: inviteCode4.createdAt.toISOString(),
          usedAt: undefined,
          usedBy: undefined,
        },
        {
          code: inviteCode3.code,
          expiresAt: inviteCode3.expiresAt.toISOString(),
          createdAt: inviteCode3.createdAt.toISOString(),
          usedAt: undefined,
          usedBy: undefined,
        },
      ],
      cursor: inviteCode3.createdAt.toISOString(),
    });

    // act - 2ページ目
    const page2 = await getInviteCodesUseCase.execute({
      limit: 2,
      cursor: page1.cursor,
    });

    // assert
    expect(page2).toEqual({
      codes: [
        {
          code: inviteCode2.code,
          expiresAt: inviteCode2.expiresAt.toISOString(),
          createdAt: inviteCode2.createdAt.toISOString(),
          usedAt: undefined,
          usedBy: undefined,
        },
        {
          code: inviteCode1.code,
          expiresAt: inviteCode1.expiresAt.toISOString(),
          createdAt: inviteCode1.createdAt.toISOString(),
          usedAt: undefined,
          usedBy: undefined,
        },
      ],
      cursor: undefined,
    });
  });

  test("使用済み招待コードの場合、使用情報を返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const inviteCode = await inviteCodeFactory(ctx.db)
      .props({
        createdAt: () => new Date("2024-01-01T00:00:00.000Z"),
        expiresAt: () => new Date("2024-01-08T00:00:00.000Z"),
        usedAt: () => new Date("2024-01-02T00:00:00.000Z"),
      })
      .create();
    await subscriptionFactory(ctx.db)
      .props({
        actorDid: () => actor.did,
        inviteCode: () => inviteCode.code,
      })
      .create();

    // act
    const result = await getInviteCodesUseCase.execute({
      limit: 50,
    });

    // assert
    expect(result).toEqual({
      codes: [
        {
          code: inviteCode.code,
          expiresAt: inviteCode.expiresAt.toISOString(),
          createdAt: inviteCode.createdAt.toISOString(),
          usedAt: "2024-01-02T00:00:00.000Z",
          usedBy: {
            did: actor.did,
            handle: actor.handle,
          },
        },
      ],
      cursor: undefined,
    });
  });

  test("使用済み招待コードでActorが削除されている場合、usedByはnullになる", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const inviteCode = await inviteCodeFactory(ctx.db)
      .props({
        createdAt: () => new Date("2024-01-01T00:00:00.000Z"),
        expiresAt: () => new Date("2024-01-08T00:00:00.000Z"),
        usedAt: () => new Date("2024-01-02T00:00:00.000Z"),
      })
      .create();
    await subscriptionFactory(ctx.db)
      .props({
        actorDid: () => actor.did,
        inviteCode: () => inviteCode.code,
      })
      .create();

    // Actorを削除
    await ctx.db.delete(schema.actors).where(eq(schema.actors.did, actor.did));

    // act
    const result = await getInviteCodesUseCase.execute({
      limit: 50,
    });

    // assert
    expect(result).toEqual({
      codes: [
        {
          code: inviteCode.code,
          expiresAt: inviteCode.expiresAt.toISOString(),
          createdAt: inviteCode.createdAt.toISOString(),
          usedAt: "2024-01-02T00:00:00.000Z",
          usedBy: undefined,
        },
      ],
      cursor: undefined,
    });
  });
});
