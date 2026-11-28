import client from "prom-client";

import type {
  CounterKey,
  GaugeKey,
  IMetricReporter,
  LabelsValue,
} from "../../interface/metric.js";

type CounterMap = {
  [key in CounterKey]: client.Counter;
};

type GaugeMap = {
  [key in GaugeKey]: client.Gauge;
};

export class MetricReporter implements IMetricReporter {
  private readonly counters: CounterMap;
  private readonly gauges: GaugeMap;

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
        labelNames: ["source"],
        help: "Total number of identity events received by the worker",
      }),
      worker_events_commit_total: new client.Counter({
        name: "worker_events_commit_total",
        labelNames: ["source", "collection"],
        help: "Total number of commit events received by the worker",
      }),
      worker_events_label_total: new client.Counter({
        name: "worker_events_label_total",
        help: "Total number of label messages processed by the worker",
      }),
      worker_jetstream_gap_total: new client.Counter({
        name: "worker_jetstream_gap_total",
        help: "Total number of times Jetstream events were lost beyond the lookback window",
      }),
      worker_jetstream_events_received_total: new client.Counter({
        name: "worker_jetstream_events_received_total",
        help: "Total number of events received from Jetstream before filtering",
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
    this.gauges = {
      worker_jetstream_last_event_time_seconds: new client.Gauge({
        name: "worker_jetstream_last_event_time_seconds",
        help: "Unix time of the last event received from Jetstream",
      }),
    };
  }

  set(key: GaugeKey, value: number): void {
    this.gauges[key].set(value);
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
