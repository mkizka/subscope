import { getTestSetup, inviteCodeFactory } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { InviteCodeRepository } from "../../../infrastructure/invite-code-repository.js";
import { InviteCodeService } from "../../service/admin/invite-code-service.js";
import { GetInviteCodesUseCase } from "./get-invite-codes-use-case.js";

describe("GetInviteCodesUseCase", () => {
  const { testInjector, ctx } = getTestSetup();

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
    expect(result).toMatchObject({
      codes: [
        {
          code: inviteCode2.code,
          expiresAt: inviteCode2.expiresAt.toISOString(),
          createdAt: inviteCode2.createdAt.toISOString(),
        },
        {
          code: inviteCode1.code,
          expiresAt: inviteCode1.expiresAt.toISOString(),
          createdAt: inviteCode1.createdAt.toISOString(),
        },
      ],
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
    expect(result).toMatchObject({
      codes: [{ code: inviteCode3.code }, { code: inviteCode2.code }],
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
    expect(result).toMatchObject({
      codes: [{ code: inviteCode1.code }],
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
    expect(page1).toMatchObject({
      codes: [{ code: inviteCode4.code }, { code: inviteCode3.code }],
      cursor: inviteCode3.createdAt.toISOString(),
    });

    // act - 2ページ目
    const page2 = await getInviteCodesUseCase.execute({
      limit: 2,
      cursor: page1.cursor,
    });

    // assert
    expect(page2).toMatchObject({
      codes: [{ code: inviteCode2.code }, { code: inviteCode1.code }],
      cursor: undefined,
    });
  });
});
