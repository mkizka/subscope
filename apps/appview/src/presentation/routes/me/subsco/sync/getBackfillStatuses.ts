import type { LexRouter } from "@atproto/lex-server";
import getBackfillStatuses from "@repo/client/me/subsco/sync/getBackfillStatuses";

import type { GetBackfillStatusesUseCase } from "../../../../../application/use-cases/sync/get-backfill-statuses-use-case.js";

export class GetBackfillStatuses {
  constructor(
    private readonly getBackfillStatusesUseCase: GetBackfillStatusesUseCase,
  ) {}

  handle(router: LexRouter) {
    router.add(getBackfillStatuses, async ({ params }) => {
      const result = await this.getBackfillStatusesUseCase.execute({
        dids: params.dids,
      });
      return { body: result };
    });
  }
}
