import { Subscription } from "@atproto/xrpc-server";
import * as subscribeLabels from "@repo/client/com/atproto/label/subscribeLabels";
import type { IMetricReporter } from "@repo/common/interface";

import type { ICursorStore } from "../application/interfaces/external/cursor-store.js";
import type { IndexLabelUseCase } from "../application/use-cases/label/index-label-use-case.js";
import type { Env } from "../shared/env.js";

export class LabelSubscriber {
  private readonly subscription;

  constructor(
    private readonly deps: {
      metricReporter: IMetricReporter;
      indexLabelUseCase: IndexLabelUseCase;
      cursorStore: ICursorStore;
      env: Pick<Env, "MODERATION_URL">;
    },
  ) {
    this.subscription = new Subscription({
      service: deps.env.MODERATION_URL,
      method: subscribeLabels.$nsid,
      getParams: async () => {
        const cursor = await this.deps.cursorStore.getCursor(
          this.deps.env.MODERATION_URL,
        );
        return cursor === undefined ? {} : { cursor };
      },
      validate: (obj: unknown) => subscribeLabels.$message.$ifMatches(obj),
    });
  }

  async start() {
    for await (const message of this.subscription) {
      if (subscribeLabels.labels.$isTypeOf(message)) {
        this.deps.metricReporter.increment("worker_events_label_total");
        for (const label of message.labels) {
          await this.deps.indexLabelUseCase.execute(label);
        }
        await this.deps.cursorStore.setCursor(
          this.deps.env.MODERATION_URL,
          message.seq,
        );
      }
    }
  }
}
