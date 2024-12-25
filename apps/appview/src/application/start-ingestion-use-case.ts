export interface IIngester {
  start(): void;
}

export class StartIngestionUseCase {
  constructor(private ingester: IIngester) {}
  static inject = ["ingester"] as const;

  execute() {
    this.ingester.start();
  }
}
