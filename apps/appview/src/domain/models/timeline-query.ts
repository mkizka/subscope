export class TimelineQuery {
  constructor(
    public readonly authDid: string,
    public readonly before?: Date,
    public readonly limit: number = 50,
  ) {}

  get queryLimit(): number {
    return this.limit + 1;
  }

  static fromCursor({
    authDid,
    cursor,
    limit = 50,
  }: {
    authDid: string;
    cursor?: string;
    limit?: number;
  }): TimelineQuery {
    const before = cursor ? new Date(cursor) : undefined;
    return new TimelineQuery(authDid, before, limit);
  }
}
