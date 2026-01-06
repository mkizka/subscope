export interface ScheduleOptions {
  timezone?: string;
}

export interface ITaskScheduler {
  start: (
    cronExpression: string,
    task: () => Promise<void>,
    options?: ScheduleOptions,
  ) => void;
}
