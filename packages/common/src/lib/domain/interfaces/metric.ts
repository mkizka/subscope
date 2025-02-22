export type CounterKey =
  | "did_cache_hit_total"
  | "did_cache_miss_total"
  | "did_resolve_total"
  | "did_resolve_error_total"
  | "ingester_events_account_total"
  | "ingester_events_identity_total"
  | "ingester_events_commit_total";

export type GaugeKey = "ingester_events_time_delay";

export type LabelsValue = Record<string, string | number>;

export interface IMetricReporter {
  increment: (key: CounterKey, labels?: LabelsValue) => void;
  setGauge: (key: GaugeKey, value: number, labels?: LabelsValue) => void;
  setTimeDelayGauge: (timeUs: number) => void;
  getMetrics: () => Promise<string>;
}
