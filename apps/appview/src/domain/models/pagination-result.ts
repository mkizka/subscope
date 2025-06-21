export class PaginationResult<T> {
  constructor(
    public readonly items: T[],
    public readonly cursor?: string,
  ) {}

  static create<T>(
    items: T[],
    limit: number,
    getTimestamp: (item: T) => Date,
  ): PaginationResult<T> {
    const hasMore = items.length > limit;
    const actualItems = hasMore ? items.slice(0, limit) : items;

    if (hasMore && actualItems.length > 0) {
      const lastItem = actualItems[actualItems.length - 1];
      if (lastItem) {
        const cursor = getTimestamp(lastItem).toISOString();
        return new PaginationResult(actualItems, cursor);
      }
    }

    return new PaginationResult(actualItems);
  }
}
