import { actorFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("VerifyAccessUseCase", () => {
  let sut: TestServices["verifyAccessUseCase"];
  let actorRepo: TestServices["actorRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    sut = services.verifyAccessUseCase;
    actorRepo = services.actorRepository;
  });

  test("リクエストユーザーが管理者の場合、authorizedを返す", async () => {
    // arrange
    const admin = actorFactory({ isAdmin: true });
    actorRepo.add(admin);

    // act
    const result = await sut.execute({
      requesterDid: admin.did,
    });

    // assert
    expect(result.status).toBe("authorized");
  });

  test("リクエストユーザーが管理者でない場合、unauthorizedを返す", async () => {
    // arrange
    const normalUser = actorFactory({ isAdmin: false });
    actorRepo.add(normalUser);

    // act
    const result = await sut.execute({
      requesterDid: normalUser.did,
    });

    // assert
    expect(result.status).toBe("unauthorized");
  });
});
