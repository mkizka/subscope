export type CounterKey =
  | "resolve_did_request_total"
  | "resolve_did_cache_hit_total"
  | "resolve_did_cache_miss_total"
  | "resolve_did_error_total"
  | "worker_events_identity_total"
  | "worker_events_commit_total"
  | "worker_events_label_total"
  | "worker_records_indexed_total"
  | "worker_jetstream_gap_total"
  | "worker_jetstream_events_received_total"
  | "fetch_record_request_total"
  | "fetch_record_error_total";

export type GaugeKey = "worker_jetstream_last_event_time_seconds";

export type LabelsValue = Record<string, string | number>;

export interface IMetricReporter {
  increment: (key: CounterKey, labels?: LabelsValue) => void;
  set: (key: GaugeKey, value: number) => void;
  getMetrics: () => Promise<string>;
}
