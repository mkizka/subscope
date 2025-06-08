import type { AtUri } from "@atproto/syntax";
import type { Post } from "@dawn/common/domain";

export interface IPostRepository {
  findMany: (params: { limit: number; cursor?: string }) => Promise<Post[]>;
  findByUris: (uris: AtUri[]) => Promise<Post[]>;
}
