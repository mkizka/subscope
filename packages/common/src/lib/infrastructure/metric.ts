import client from "prom-client";

import type {
  IMetricReporter,
  LabelsValue,
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
  ingester_events_account_total: new client.Counter({
    name: "ingester_events_account_total",
    help: "Total number of account events processed by the ingester",
  }),
  ingester_events_identity_total: new client.Counter({
    name: "ingester_events_identity_total",
    labelNames: ["change_handle"],
    help: "Total number of identity events processed by the ingester",
  }),
  ingester_events_commit_total: new client.Counter({
    name: "ingester_events_commit_total",
    labelNames: ["collection"],
    help: "Total number of commit events processed by the ingester",
  }),
} satisfies {
  [key in MetricKey]: client.Counter;
};

export class MetricReporter implements IMetricReporter {
  resetAll(): void {
    Object.values(metrics).forEach((metric) => metric.inc(0));
  }
  increment(key: MetricKey, labels?: LabelsValue): void {
    if (labels) {
      metrics[key].inc(labels);
    } else {
      metrics[key].inc();
    }
  }
  getMetrics() {
    return client.register.metrics();
  }
}
