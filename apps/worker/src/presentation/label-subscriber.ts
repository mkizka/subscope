import { Subscription } from "@atproto/xrpc-server";
import * as subscribeLabels from "@repo/client/lex/com/atproto/label/subscribeLabels";
import type { IMetricReporter } from "@repo/common/domain";

import type { ILabelCursorStore } from "../application/interfaces/external/label-cursor-store.js";
import type { IndexLabelUseCase } from "../application/use-cases/label/index-label-use-case.js";

export class LabelSubscriber {
  private readonly subscription;

  constructor(
    private readonly metricReporter: IMetricReporter,
    private readonly indexLabelUseCase: IndexLabelUseCase,
    private readonly labelCursorStore: ILabelCursorStore,
    private readonly moderationUrl: string,
  ) {
    this.subscription = new Subscription({
      service: moderationUrl,
      method: subscribeLabels.$nsid,
      getParams: async () => {
        const cursor = await this.labelCursorStore.getCursor(
          this.moderationUrl,
        );
        return cursor === undefined ? {} : { cursor };
      },
      validate: (obj: unknown) => subscribeLabels.$message.$ifMatches(obj),
    });
  }

  async start() {
    for await (const message of this.subscription) {
      if (subscribeLabels.labels.$isTypeOf(message)) {
        this.metricReporter.increment("ingester_labels_labels_total");
        for (const label of message.labels) {
          await this.indexLabelUseCase.execute(label);
        }
        await this.labelCursorStore.setCursor(this.moderationUrl, message.seq);
      } else if (subscribeLabels.info.$isTypeOf(message)) {
        this.metricReporter.increment("ingester_labels_info_total");
      }
    }
  }
}
