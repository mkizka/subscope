import type { Post } from "@dawn/common/domain";

export interface IPostRepository {
  findMany: (params: { limit: number }) => Promise<Post[]>;
}
