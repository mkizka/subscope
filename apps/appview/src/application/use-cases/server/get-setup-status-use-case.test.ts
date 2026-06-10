import { actorFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("GetSetupStatusUseCase", () => {
  let services: TestServices;
  beforeEach(async () => {
    services = await testRegistry.resolve();
  });

  test("管理者が存在しない場合、initializedがfalseを返す", async () => {
    const { getSetupStatusUseCase } = services;
    // act
    const result = await getSetupStatusUseCase.execute();

    // assert
    expect(result.initialized).toBe(false);
  });

  test("管理者が存在する場合、initializedがtrueを返す", async () => {
    const { getSetupStatusUseCase, actorRepository } = services;
    // arrange
    const admin = actorFactory({ isAdmin: true });
    actorRepository.add(admin);

    // act
    const result = await getSetupStatusUseCase.execute();

    // assert
    expect(result.initialized).toBe(true);
  });
});
