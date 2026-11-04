export const getSortAt = (row: { createdAt: Date; indexedAt: Date }) =>
  row.indexedAt < row.createdAt ? row.indexedAt : row.createdAt;
