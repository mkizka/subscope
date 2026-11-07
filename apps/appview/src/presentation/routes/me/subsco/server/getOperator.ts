import type { LexRouter } from "@atproto/lex-server";
import getOperator from "@repo/client/me/subsco/server/getOperator";

import type { GetOperatorUseCase } from "../../../../../application/use-cases/server/get-operator-use-case.js";

export class GetOperator {
  constructor(private readonly getOperatorUseCase: GetOperatorUseCase) {}

  handle(router: LexRouter) {
    router.add(getOperator, async () => {
      const result = await this.getOperatorUseCase.execute();
      return { body: result };
    });
  }
}
