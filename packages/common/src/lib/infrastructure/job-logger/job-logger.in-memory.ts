import type { IJobLogger } from "../../domain/interfaces/job-logger.js";

export class InMemoryJobLogger implements IJobLogger {
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
