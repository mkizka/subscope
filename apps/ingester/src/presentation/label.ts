import { Subscription } from "@atproto/xrpc-server";
import { ComAtprotoLabelSubscribeLabels } from "@repo/client/api";
import type { IMetricReporter } from "@repo/common/domain";

import { env } from "../shared/env.js";

export class LabelIngester {
  private readonly subscription;

  constructor(private readonly metricReporter: IMetricReporter) {
    this.subscription = new Subscription({
      service: env.MODERATION_URL,
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
  static inject = ["metricReporter"] as const;

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
