import client from "prom-client";

import type {
  IMetricReporter,
  MetricKey,
} from "../domain/interfaces/metric.js";

const metrics = {
  did_cache_hit_total: new client.Counter({
    name: "did_cache_hit_total",
    help: "Total number of did resolver cache hits",
  }),
  did_cache_miss_total: new client.Counter({
    name: "did_cache_miss_total",
    help: "Total number of did resolver cache misses",
  }),
  did_resolve_total: new client.Counter({
    name: "did_resolve_total",
    help: "Total number of did resolves",
  }),
  did_resolve_error_total: new client.Counter({
    name: "did_resolve_error_total",
    help: "Total number of did resolve errors",
  }),
} satisfies {
  [key in MetricKey]: client.Counter;
};

export class MetricReporter implements IMetricReporter {
  resetAll(): void {
    Object.values(metrics).forEach((metric) => metric.inc(0));
  }
  increment(key: MetricKey): void {
    metrics[key].inc();
  }
}
