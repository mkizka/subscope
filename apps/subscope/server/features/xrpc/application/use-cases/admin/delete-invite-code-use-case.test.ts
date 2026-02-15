import { inviteCodeFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "@/server/features/xrpc/test-utils.js";

import { DeleteInviteCodeUseCase } from "./delete-invite-code-use-case.js";

describe("DeleteInviteCodeUseCase", () => {
  const useCase = testInjector.injectClass(DeleteInviteCodeUseCase);
  const inviteCodeRepository = testInjector.resolve("inviteCodeRepository");

  test("未使用の招待コードの場合、削除できる", async () => {
    // arrange
    const inviteCode = inviteCodeFactory({ code: "test-abc12" });
    inviteCodeRepository.add(inviteCode);

    // act
    await useCase.execute({ code: "test-abc12" });

    // assert
    const result = await inviteCodeRepository.findFirst("test-abc12");
    expect(result).toBeNull();
  });

  test("存在しない招待コードの場合、エラーを返す", async () => {
    // act & assert
    await expect(useCase.execute({ code: "nonexistent-code" })).rejects.toThrow(
      "Invite code not found",
    );
  });

  test("使用済みの招待コードの場合、エラーを返す", async () => {
    // arrange
    const inviteCode = inviteCodeFactory({
      code: "test-used1",
      usedAt: new Date(),
    });
    inviteCodeRepository.add(inviteCode);

    // act & assert
    await expect(useCase.execute({ code: "test-used1" })).rejects.toThrow(
      "Invite code already used",
    );
  });
});
