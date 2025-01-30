export type MetricKey =
  | "did_cache_hit_total"
  | "did_cache_miss_total"
  | "did_resolve_total"
  | "did_resolve_error_total";

export interface IMetricReporter {
  resetAll(): void;
  increment(key: MetricKey): void;
}
