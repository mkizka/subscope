import { actorFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../test-utils.js";
import {
  AdminAlreadyExistsError,
  RegisterAdminUseCase,
} from "./register-admin-use-case.js";

describe("RegisterAdminUseCase", () => {
  const registerAdminUseCase = testInjector.injectClass(RegisterAdminUseCase);
  const actorRepo = testInjector.resolve("actorRepository");

  test("管理者が存在しない場合、リクエストユーザーを管理者に昇格する", async () => {
    // arrange
    const requester = actorFactory({ isAdmin: false });
    actorRepo.add(requester);

    // act
    await registerAdminUseCase.execute({
      requesterDid: requester.did,
    });

    // assert
    const updatedActor = await actorRepo.findByDid(requester.did);
    expect(updatedActor?.isAdmin).toBe(true);
  });

  test("管理者が既に存在する場合、AdminAlreadyExistsErrorをスローする", async () => {
    // arrange
    const admin = actorFactory({ isAdmin: true });
    actorRepo.add(admin);

    const requester = actorFactory({ isAdmin: false });
    actorRepo.add(requester);

    // act & assert
    await expect(
      registerAdminUseCase.execute({
        requesterDid: requester.did,
      }),
    ).rejects.toThrow(AdminAlreadyExistsError);
  });

  test("リクエストユーザーが存在しない場合、新規作成して管理者に昇格する", async () => {
    // arrange
    const nonExistentDid = "did:plc:nonexistent";

    // act
    await registerAdminUseCase.execute({
      requesterDid: nonExistentDid,
    });

    // assert
    const createdActor = await actorRepo.findByDid(nonExistentDid);
    expect(createdActor).not.toBeNull();
    expect(createdActor?.isAdmin).toBe(true);
  });
});
