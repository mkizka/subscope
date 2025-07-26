export type CounterKey =
  | "resolve_did_cache_hit_total"
  | "resolve_did_cache_miss_total"
  | "resolve_did_error_total"
  | "ingester_events_account_total"
  | "ingester_events_identity_total"
  | "ingester_events_commit_total"
  | "blob_proxy_cache_hit_total"
  | "blob_proxy_cache_miss_total"
  | "blob_proxy_error_total";

export type GaugeKey =
  | "ingester_events_time_delay"
  | "ingester_websocket_connection_state";

export type LabelsValue = Record<string, string | number>;

export type ConnectionStates = "opened" | "stable" | "closed";

export interface IMetricReporter {
  increment: (key: CounterKey, labels?: LabelsValue) => void;
  setConnectionStateGauge: (state: ConnectionStates) => void;
  setTimeDelayGauge: (timeUs: number) => void;
  getMetrics: () => Promise<string>;
}
