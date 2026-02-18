import client from "prom-client";

import type {
  ConnectionStates,
  CounterKey,
  GaugeKey,
  IMetricReporter,
  LabelsValue,
} from "../../domain/interfaces/metric.js";

const connectionStates = {
  opened: 1,
  stable: 2,
  closed: 3,
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
      ingester_labels_info_total: new client.Counter({
        name: "ingester_labels_info_total",
        help: "Total number of label info messages processed by the ingester",
      }),
      ingester_labels_labels_total: new client.Counter({
        name: "ingester_labels_labels_total",
        help: "Total number of label messages processed by the ingester",
      }),
      blob_proxy_cache_hit_total: new client.Counter({
        name: "blob_proxy_cache_hit_total",
        help: "Total number of blob cache hits",
      }),
      blob_proxy_cache_miss_total: new client.Counter({
        name: "blob_proxy_cache_miss_total",
        help: "Total number of blob cache misses",
      }),
      blob_proxy_error_total: new client.Counter({
        name: "blob_proxy_error_total",
        labelNames: ["error"],
        help: "Total number of blob proxy errors",
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
