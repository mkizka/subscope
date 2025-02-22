import client from "prom-client";

import type {
  CounterKey,
  GaugeKey,
  IMetricReporter,
  LabelsValue,
} from "../domain/interfaces/metric.js";

const counters = {
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
  [key in CounterKey]: client.Counter;
};

const gauges = {
  ingester_events_time_delay: new client.Gauge({
    name: "ingester_events_time_delay",
    help: "Time delay of events processed by the ingester",
  }),
} satisfies {
  [key in GaugeKey]: client.Gauge;
};

export class MetricReporter implements IMetricReporter {
  increment(key: CounterKey, labels?: LabelsValue): void {
    if (labels) {
      counters[key].inc(labels);
    } else {
      counters[key].inc();
    }
  }
  setGauge(key: GaugeKey, value: number, labels?: LabelsValue) {
    if (labels) {
      gauges[key].set(labels, value);
    } else {
      gauges[key].set(value);
    }
  }
  setTimeDelayGauge(timeUs: number) {
    const dalay = Date.now() * 1000 - timeUs;
    gauges.ingester_events_time_delay.set(dalay);
  }
  getMetrics() {
    return client.register.metrics();
  }
}
