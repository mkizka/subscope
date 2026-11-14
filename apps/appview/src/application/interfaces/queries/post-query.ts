import type { AtUri } from "@atproto/syntax";

import type { PostDto } from "../../dto/post-dto.js";

export interface IPostQuery {
  findByUris: (uris: AtUri[]) => Promise<PostDto[]>;
  findReplies: (uri: AtUri, limit?: number) => Promise<PostDto[]>;
  findQuotes: (params: {
    uri: string;
    limit: number;
    cursor?: Date;
  }) => Promise<PostDto[]>;
  search: (params: {
    terms: string[];
    authorDids?: string[];
    replies?: "only" | "exclude";
    limit: number;
    cursor?: Date;
  }) => Promise<PostDto[]>;
}
