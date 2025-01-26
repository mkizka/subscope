import client from "prom-client";

import type { IMetric } from "../../application/interfaces/metric.js";

export class Metric implements IMetric {
  private readonly counters = new Map<string, client.Counter>();

  increment(config: { name: string; help: string }) {
    const existingCounter = this.counters.get(config.name);
    if (existingCounter) {
      existingCounter.inc();
      return;
    }
    const newCounter = new client.Counter(config);
    newCounter.inc();
    this.counters.set(config.name, newCounter);
  }
}
