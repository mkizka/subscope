import { actorFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "@/server/features/xrpc/test-utils.js";

import { GetSetupStatusUseCase } from "./get-setup-status-use-case.js";

describe("GetSetupStatusUseCase", () => {
  const getSetupStatusUseCase = testInjector.injectClass(GetSetupStatusUseCase);
  const actorRepo = testInjector.resolve("actorRepository");

  test("管理者が存在しない場合、initializedがfalseを返す", async () => {
    // act
    const result = await getSetupStatusUseCase.execute();

    // assert
    expect(result.initialized).toBe(false);
  });

  test("管理者が存在する場合、initializedがtrueを返す", async () => {
    // arrange
    const admin = actorFactory({ isAdmin: true });
    actorRepo.add(admin);

    // act
    const result = await getSetupStatusUseCase.execute();

    // assert
    expect(result.initialized).toBe(true);
  });
});
