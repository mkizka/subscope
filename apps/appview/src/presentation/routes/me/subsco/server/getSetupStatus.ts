import type { LexRouter } from "@atproto/lex-server";
import getSetupStatus from "@repo/client/lex/me/subsco/server/getSetupStatus";

import type { GetSetupStatusUseCase } from "../../../../../application/use-cases/server/get-setup-status-use-case.js";

export class GetSetupStatus {
  constructor(private readonly getSetupStatusUseCase: GetSetupStatusUseCase) {}
  static inject = ["getSetupStatusUseCase"] as const;

  handle(router: LexRouter) {
    router.add(getSetupStatus, async () => {
      const result = await this.getSetupStatusUseCase.execute();
      return { body: result };
    });
  }
}
