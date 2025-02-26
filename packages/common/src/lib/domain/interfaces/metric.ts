export type CounterKey =
  | "did_cache_hit_total"
  | "did_cache_miss_total"
  | "did_resolve_total"
  | "did_resolve_error_total"
  | "ingester_events_account_total"
  | "ingester_events_identity_total"
  | "ingester_events_commit_total";

export type GaugeKey =
  | "ingester_events_time_delay"
  | "ingester_websocket_connection_state";

export type LabelsValue = Record<string, string | number>;

export type ConnectionStates = "open" | "close" | "error" | "reconnecting";

export interface IMetricReporter {
  increment: (key: CounterKey, labels?: LabelsValue) => void;
  setConnectionStateGauge: (state: ConnectionStates) => void;
  setTimeDelayGauge: (timeUs: number) => void;
  getMetrics: () => Promise<string>;
}
