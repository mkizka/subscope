import type { SearchPost } from "@repo/common/domain";

export interface ISearchPostRepository {
  upsert: (searchPost: SearchPost) => Promise<void>;
  delete: (searchPost: SearchPost) => Promise<void>;
}
