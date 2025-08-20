import { getTestSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { InviteCodeRepository } from "../../../infrastructure/invite-code-repository.js";
import { CreateInviteCodeUseCase } from "./create-invite-code-use-case.js";

describe("CreateInviteCodeUseCase", () => {
  const { testInjector, ctx } = getTestSetup();

  const useCase = testInjector
    .provideClass("inviteCodeRepository", InviteCodeRepository)
    .provideValue("publicUrl", "https://example.com")
    .injectClass(CreateInviteCodeUseCase);

  test("有効期限が適切に指定されている場合、招待コードと有効期限を返す", async () => {
    // arrange
    const daysToExpire = 7;

    // act
    const result = await useCase.execute({ daysToExpire });

    // assert
    expect(result.code).toMatch(/^example-com-[a-z0-9]{5}$/);
    expect(result.expiresAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );

    // 有効期限が7日後であることを確認
    const expiresAt = new Date(result.expiresAt);
    const now = new Date();
    const diffInDays = Math.round(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(diffInDays).toBe(7);
  });

  test("境界値の場合、最小と最大の有効期限が正しく設定される", async () => {
    // arrange & act - 最小値1日
    const result1 = await useCase.execute({ daysToExpire: 1 });

    // assert
    const expiresAt1 = new Date(result1.expiresAt);
    const now1 = new Date();
    const diffInDays1 = Math.round(
      (expiresAt1.getTime() - now1.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(diffInDays1).toBe(1);

    // arrange & act - 最大値365日
    const result365 = await useCase.execute({ daysToExpire: 365 });

    // assert
    const expiresAt365 = new Date(result365.expiresAt);
    const now365 = new Date();
    const diffInDays365 = Math.round(
      (expiresAt365.getTime() - now365.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(diffInDays365).toBe(365);
  });

  test("同じ有効期限でくり返し呼ばれた場合、異なる招待コードを返す", async () => {
    // arrange & act
    const result1 = await useCase.execute({ daysToExpire: 30 });
    const result2 = await useCase.execute({ daysToExpire: 30 });

    // assert
    expect(result1.code).not.toBe(result2.code);
    expect(result1.code).toMatch(/^example-com-[a-z0-9]{5}$/);
    expect(result2.code).toMatch(/^example-com-[a-z0-9]{5}$/);
  });
});
