import { actorFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../test-utils.js";
import { VerifyAccessUseCase } from "./verify-access-use-case.js";

describe("VerifyAccessUseCase", () => {
  const verifyAccessUseCase = testInjector.injectClass(VerifyAccessUseCase);
  const actorRepo = testInjector.resolve("actorRepository");

  test("管理者が存在しない場合、needsSetupを返す", async () => {
    // arrange
    const requester = actorFactory({ isAdmin: false });
    actorRepo.add(requester);

    // act
    const result = await verifyAccessUseCase.execute({
      requesterDid: requester.did,
    });

    // assert
    expect(result.status).toBe("needsSetup");
  });

  test("リクエストユーザーが管理者の場合、authorizedを返す", async () => {
    // arrange
    const admin = actorFactory({ isAdmin: true });
    actorRepo.add(admin);

    // act
    const result = await verifyAccessUseCase.execute({
      requesterDid: admin.did,
    });

    // assert
    expect(result.status).toBe("authorized");
  });

  test("管理者は存在するがリクエストユーザーが管理者でない場合、unauthorizedを返す", async () => {
    // arrange
    const admin = actorFactory({ isAdmin: true });
    actorRepo.add(admin);

    const normalUser = actorFactory({ isAdmin: false });
    actorRepo.add(normalUser);

    // act
    const result = await verifyAccessUseCase.execute({
      requesterDid: normalUser.did,
    });

    // assert
    expect(result.status).toBe("unauthorized");
  });
});
