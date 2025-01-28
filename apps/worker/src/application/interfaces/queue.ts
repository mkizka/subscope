export interface IQueueService {
  addTask: (name: string, data: unknown) => Promise<void>;
}
