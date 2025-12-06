import type { JobLogger } from "./job.js";

export class InMemoryJobLogger implements JobLogger {
  private logs: string[] = [];

  async log(message: string): Promise<number> {
    this.logs.push(message);
    return this.logs.length;
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}
