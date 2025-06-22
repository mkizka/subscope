export interface Paginator<T> {
  queryLimit: number;
  extractPage: (items: T[]) => Page<T>;
}

export interface Page<T> {
  items: T[];
  cursor?: string;
}

export function createCursorPaginator<T>(
  limit: number,
  getCursor: (item: T) => string,
): Paginator<T> {
  return {
    queryLimit: limit + 1,
    extractPage: (items: T[]): Page<T> => {
      const hasMore = items.length > limit;
      const pageItems = hasMore ? items.slice(0, limit) : items;

      let cursor: string | undefined;
      if (hasMore && pageItems.length > 0) {
        const lastItem = pageItems[pageItems.length - 1];
        if (lastItem) {
          cursor = getCursor(lastItem);
        }
      }

      return { items: pageItems, cursor };
    },
  };
}
