export class LikeQuery {
  constructor(
    public readonly subjectUri: string,
    public readonly limit: number,
    public readonly before?: Date,
  ) {}

  get queryLimit(): number {
    return this.limit + 1;
  }

  static fromCursor({
    subjectUri,
    limit,
    cursor,
  }: {
    subjectUri: string;
    limit: number;
    cursor?: string;
  }): LikeQuery {
    const before = cursor ? new Date(cursor) : undefined;
    return new LikeQuery(subjectUri, limit, before);
  }
}
