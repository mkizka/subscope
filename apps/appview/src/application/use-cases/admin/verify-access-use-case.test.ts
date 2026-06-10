import { actorFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("VerifyAccessUseCase", () => {
  let services: TestServices;
  beforeEach(async () => {
    services = await testRegistry.resolve();
  });

  test("リクエストユーザーが管理者の場合、authorizedを返す", async () => {
    const { verifyAccessUseCase, actorRepository } = services;
    // arrange
    const admin = actorFactory({ isAdmin: true });
    actorRepository.add(admin);

    // act
    const result = await verifyAccessUseCase.execute({
      requesterDid: admin.did,
    });

    // assert
    expect(result.status).toBe("authorized");
  });

  test("リクエストユーザーが管理者でない場合、unauthorizedを返す", async () => {
    const { verifyAccessUseCase, actorRepository } = services;
    // arrange
    const normalUser = actorFactory({ isAdmin: false });
    actorRepository.add(normalUser);

    // act
    const result = await verifyAccessUseCase.execute({
      requesterDid: normalUser.did,
    });

    // assert
    expect(result.status).toBe("unauthorized");
  });
});
