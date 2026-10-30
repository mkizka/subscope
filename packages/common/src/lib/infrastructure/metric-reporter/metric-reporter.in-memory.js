export class InMemoryMetricReporter {
  counters = new Map();
  connectionState = "closed";
  timeDelay = 0;
  clear() {
    this.counters.clear();
    this.connectionState = "closed";
    this.timeDelay = 0;
  }
  increment(key, labels) {
    const labelKey = labels ? JSON.stringify(labels) : "";
    const counterKey = `${key}:${labelKey}`;
    this.counters.set(counterKey, (this.counters.get(counterKey) ?? 0) + 1);
  }
  setConnectionStateGauge(state) {
    this.connectionState = state;
  }
  setTimeDelayGauge(timeUs) {
    this.timeDelay = timeUs;
  }
  async getMetrics() {
    const lines = [];
    for (const [key, value] of this.counters.entries()) {
      lines.push(`${key} ${value}`);
    }
    lines.push(`connection_state ${this.connectionState}`);
    lines.push(`time_delay ${this.timeDelay}`);
    return lines.join("\n");
  }
  getCounter(key, labels) {
    const labelKey = labels ? JSON.stringify(labels) : "";
    const counterKey = `${key}:${labelKey}`;
    return this.counters.get(counterKey) ?? 0;
  }
}
