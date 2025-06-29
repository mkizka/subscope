import client from "prom-client";

import type {
  ConnectionStates,
  CounterKey,
  GaugeKey,
  IMetricReporter,
  LabelsValue,
} from "../domain/interfaces/metric.js";

const connectionStates = {
  open: 1,
  error: 2,
  close: 3,
  reconnecting: 4,
} satisfies {
  [key in ConnectionStates]: number;
};

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
    this.counters = {
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
      blob_proxy_cache_hit_total: new client.Counter({
        name: "blob_proxy_cache_hit_total",
        help: "Total number of blob cache hits",
      }),
      blob_proxy_cache_miss_total: new client.Counter({
        name: "blob_proxy_cache_miss_total",
        help: "Total number of blob cache misses",
      }),
    };
    this.gauges = {
      ingester_events_time_delay: new client.Gauge({
        name: "ingester_events_time_delay",
        help: "Time delay of events processed by the ingester",
      }),
      ingester_websocket_connection_state: new client.Gauge({
        name: "ingester_websocket_connection_state",
        help: "State of the websocket connection",
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

  setConnectionStateGauge(state: ConnectionStates) {
    this.gauges.ingester_websocket_connection_state.set(
      connectionStates[state],
    );
  }

  setTimeDelayGauge(timeUs: number) {
    const delay = Date.now() - Math.round(timeUs / 1000);
    this.gauges.ingester_events_time_delay.set(delay);
  }

  getMetrics() {
    return client.register.metrics();
  }
}
