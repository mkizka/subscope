export type MetricKey =
  | "did_cache_hit_total"
  | "did_cache_miss_total"
  | "did_resolve_total"
  | "did_resolve_error_total"
  | "ingester_events_account_total"
  | "ingester_events_identity_total"
  | "ingester_events_commit_total"
  | "fetch_profile_total"
  | "fetch_profile_error_total";

export type LabelsValue = Record<string, string | number>;

export interface IMetricReporter {
  increment: (key: MetricKey, labels?: LabelsValue) => void;
  getMetrics: () => Promise<string>;
}
