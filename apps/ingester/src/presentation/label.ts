import { Subscription } from "@atproto/xrpc-server";
import { ComAtprotoLabelSubscribeLabels } from "@repo/client/api";
import type { IMetricReporter } from "@repo/common/domain";

export class LabelIngester {
  private readonly subscription;

  constructor(
    private readonly metricReporter: IMetricReporter,
    moderationUrl: string,
  ) {
    this.subscription = new Subscription({
      service: moderationUrl,
      method: "com.atproto.label.subscribeLabels",
      validate: (obj: unknown) => {
        const parsedInfo = ComAtprotoLabelSubscribeLabels.validateInfo(obj);
        if (parsedInfo.success) {
          return parsedInfo.value;
        }
        const parsedLabels = ComAtprotoLabelSubscribeLabels.validateLabels(obj);
        if (parsedLabels.success) {
          return parsedLabels.value;
        }
        return undefined;
      },
    });
  }
  static inject = ["metricReporter", "moderationUrl"] as const;

  async start() {
    for await (const message of this.subscription) {
      if (ComAtprotoLabelSubscribeLabels.isLabels(message)) {
        this.metricReporter.increment("ingester_labels_labels_total");
      } else if (ComAtprotoLabelSubscribeLabels.isInfo(message)) {
        this.metricReporter.increment("ingester_labels_info_total");
      }
    }
  }
}
