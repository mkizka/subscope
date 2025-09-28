export class Timer {
  private startTime: number | null = null;

  start(): void {
    this.startTime = performance.now();
  }

  end(): string {
    if (this.startTime === null) {
      throw new Error("Timer has not been started.");
    }
    const duration = performance.now() - this.startTime;
    this.startTime = null;
    return duration.toFixed(2);
  }
}
