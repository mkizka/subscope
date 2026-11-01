import client from "prom-client";

import type {
  CounterKey,
  IMetricReporter,
  LabelsValue,
} from "../../domain/interfaces/metric.js";

type CounterMap = {
  [key in CounterKey]: client.Counter;
};

export class MetricReporter implements IMetricReporter {
  private readonly counters: CounterMap;

  constructor() {
    client.register.clear();
    this.counters = {
      resolve_did_request_total: new client.Counter({
        name: "resolve_did_request_total",
        help: "Total number of did resolve requests",
      }),
      resolve_did_cache_hit_total: new client.Counter({
        name: "resolve_did_cache_hit_total",
        help: "Total number of did resolver cache hits",
      }),
      resolve_did_cache_miss_total: new client.Counter({
        name: "resolve_did_cache_miss_total",
        help: "Total number of did resolver cache misses",
      }),
      resolve_did_error_total: new client.Counter({
        name: "resolve_did_error_total",
        help: "Total number of did resolve errors",
      }),
      worker_events_identity_total: new client.Counter({
        name: "worker_events_identity_total",
        help: "Total number of identity events processed by the worker",
      }),
      worker_events_commit_total: new client.Counter({
        name: "worker_events_commit_total",
        labelNames: ["collection"],
        help: "Total number of commit events processed by the worker",
      }),
      ingester_labels_info_total: new client.Counter({
        name: "ingester_labels_info_total",
        help: "Total number of label info messages processed by the ingester",
      }),
      ingester_labels_labels_total: new client.Counter({
        name: "ingester_labels_labels_total",
        help: "Total number of label messages processed by the ingester",
      }),
      fetch_record_request_total: new client.Counter({
        name: "fetch_record_request_total",
        help: "Total number of record fetch requests",
      }),
      fetch_record_error_total: new client.Counter({
        name: "fetch_record_error_total",
        help: "Total number of record fetch errors",
      }),
    };
  }

  increment(key: CounterKey, labels?: LabelsValue): void {
    if (labels) {
      this.counters[key].inc(labels);
    } else {
      this.counters[key].inc();
    }
  }

  getMetrics() {
    return client.register.metrics();
  }
}
