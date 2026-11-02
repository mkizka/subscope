import { actorFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("GetSetupStatusUseCase", () => {
  let getSetupStatusUseCase: TestServices["getSetupStatusUseCase"];
  let actorQuery: TestServices["actorQuery"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    getSetupStatusUseCase = services.getSetupStatusUseCase;
    actorQuery = services.actorQuery;
  });

  test("管理者が存在しない場合、initializedがfalseを返す", async () => {
    // act
    const result = await getSetupStatusUseCase.execute();

    // assert
    expect(result.initialized).toBe(false);
  });

  test("管理者が存在する場合、initializedがtrueを返す", async () => {
    // arrange
    const admin = actorFactory({ isAdmin: true });
    actorQuery.add(admin);

    // act
    const result = await getSetupStatusUseCase.execute();

    // assert
    expect(result.initialized).toBe(true);
  });
});
