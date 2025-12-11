import type {
  ConnectionStates,
  CounterKey,
  IMetricReporter,
  LabelsValue,
} from "../../domain/interfaces/metric.js";

export class InMemoryMetricReporter implements IMetricReporter {
  private counters: Map<string, number> = new Map();
  private connectionState: ConnectionStates = "closed";
  private timeDelay = 0;

  clear(): void {
    this.counters.clear();
    this.connectionState = "closed";
    this.timeDelay = 0;
  }

  increment(key: CounterKey, labels?: LabelsValue): void {
    const labelKey = labels ? JSON.stringify(labels) : "";
    const counterKey = `${key}:${labelKey}`;
    this.counters.set(counterKey, (this.counters.get(counterKey) ?? 0) + 1);
  }

  setConnectionStateGauge(state: ConnectionStates): void {
    this.connectionState = state;
  }

  setTimeDelayGauge(timeUs: number): void {
    this.timeDelay = timeUs;
  }

  getMetrics(): Promise<string> {
    const lines: string[] = [];
    for (const [key, value] of this.counters.entries()) {
      lines.push(`${key} ${value}`);
    }
    lines.push(`connection_state ${this.connectionState}`);
    lines.push(`time_delay ${this.timeDelay}`);
    return Promise.resolve(lines.join("\n"));
  }

  getCounter(key: CounterKey, labels?: LabelsValue): number {
    const labelKey = labels ? JSON.stringify(labels) : "";
    const counterKey = `${key}:${labelKey}`;
    return this.counters.get(counterKey) ?? 0;
  }
}
