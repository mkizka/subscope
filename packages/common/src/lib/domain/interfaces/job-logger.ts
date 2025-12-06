export interface IJobLogger {
  log: (message: string) => Promise<number>;
}
