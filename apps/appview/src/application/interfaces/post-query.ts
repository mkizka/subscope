import type { AtUri } from "@atproto/syntax";

import type { PostDto } from "../dto/post-dto.js";

export interface IPostQuery {
  findByUris: (uris: AtUri[]) => Promise<PostDto[]>;
}
