import type { LexRouter } from "@atproto/lex-server";
import getMemberStatus from "@repo/client/me/subsco/server/getMemberStatus";

import type { GetMemberStatusUseCase } from "../../../../../application/use-cases/server/get-member-status-use-case.js";

export class GetMemberStatus {
  constructor(
    private readonly getMemberStatusUseCase: GetMemberStatusUseCase,
  ) {}

  handle(router: LexRouter) {
    router.add(getMemberStatus, async ({ params }) => {
      const result = await this.getMemberStatusUseCase.execute({
        did: params.did,
      });
      return { body: result };
    });
  }
}
