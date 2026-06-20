import { actorFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("GetSetupStatusUseCase", () => {
  let sut: TestServices["getSetupStatusUseCase"];
  let actorRepository: TestServices["actorRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    sut = services.getSetupStatusUseCase;
    actorRepository = services.actorRepository;
  });

  test("管理者が存在しない場合、initializedがfalseを返す", async () => {
    // act
    const result = await sut.execute();

    // assert
    expect(result.initialized).toBe(false);
  });

  test("管理者が存在する場合、initializedがtrueを返す", async () => {
    // arrange
    const admin = actorFactory({ isAdmin: true });
    actorRepository.add(admin);

    // act
    const result = await sut.execute();

    // assert
    expect(result.initialized).toBe(true);
  });
});
