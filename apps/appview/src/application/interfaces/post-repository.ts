import type { AtUri } from "@atproto/syntax";
import type { Post } from "@repo/common/domain";

export interface IPostRepository {
  findMany: (params: { limit: number; cursor?: string }) => Promise<Post[]>;
  findByUris: (uris: AtUri[]) => Promise<Post[]>;
  findByUri: (uri: AtUri) => Promise<Post | null>;
  findReplies: (uri: AtUri, limit?: number) => Promise<Post[]>;
  search: (params: {
    query: string;
    limit: number;
    cursor?: string;
  }) => Promise<Post[]>;
}
