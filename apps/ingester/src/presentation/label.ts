import { Subscription } from "@atproto/xrpc-server";
import * as subscribeLabels from "@repo/client/lex/com/atproto/label/subscribeLabels";
import type { IMetricReporter } from "@repo/common/domain";

export class LabelIngester {
  private readonly subscription;

  constructor(
    private readonly metricReporter: IMetricReporter,
    moderationUrl: string,
  ) {
    this.subscription = new Subscription({
      service: moderationUrl,
      method: subscribeLabels.$nsid,
      validate: (obj: unknown) => subscribeLabels.$message.$ifMatches(obj),
    });
  }

  async start() {
    for await (const message of this.subscription) {
      if (subscribeLabels.labels.$isTypeOf(message)) {
        this.metricReporter.increment("ingester_labels_labels_total");
      } else if (subscribeLabels.info.$isTypeOf(message)) {
        this.metricReporter.increment("ingester_labels_info_total");
      }
    }
  }
}
