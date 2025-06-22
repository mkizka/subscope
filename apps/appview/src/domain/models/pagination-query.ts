export class PaginationQuery<T = Record<string, unknown>> {
  constructor(
    public readonly params: T,
    public readonly limit: number,
    public readonly cursor?: Date,
  ) {}

  get queryLimit(): number {
    return this.limit + 1;
  }

  static create<T = Record<string, unknown>>(
    params: T,
    options: {
      limit: number;
      cursor?: string;
    },
  ): PaginationQuery<T> {
    const cursor = options.cursor ? new Date(options.cursor) : undefined;
    return new PaginationQuery(params, options.limit, cursor);
  }
}
