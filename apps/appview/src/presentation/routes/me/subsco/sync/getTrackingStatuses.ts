import type { LexRouter } from "@atproto/lex-server";
import getTrackingStatuses from "@repo/client/me/subsco/sync/getTrackingStatuses";

import type { GetTrackingStatusesUseCase } from "../../../../../application/use-cases/sync/get-tracking-statuses-use-case.js";

export class GetTrackingStatuses {
  constructor(
    private readonly getTrackingStatusesUseCase: GetTrackingStatusesUseCase,
  ) {}

  handle(router: LexRouter) {
    router.add(getTrackingStatuses, async ({ params }) => {
      const result = await this.getTrackingStatusesUseCase.execute({
        dids: params.dids,
      });
      return { body: result };
    });
  }
}
