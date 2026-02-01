import type { Post } from "@repo/common/domain";

import type { IPostRepository } from "@/server/features/xrpc/application/interfaces/post-repository.js";
import {
  createCursorPaginator,
  type Page,
} from "@/server/features/xrpc/application/utils/pagination.js";

export class PostSearchService {
  constructor(private readonly postRepository: IPostRepository) {}
  static inject = ["postRepository"] as const;

  async findPostsWithPagination({
    query,
    cursor,
    limit,
  }: {
    query: string;
    cursor?: Date;
    limit: number;
  }): Promise<Page<Post>> {
    const paginator = createCursorPaginator<Post>({
      limit,
      getCursor: (post) => post.sortAt.toISOString(),
    });

    const posts = await this.postRepository.search({
      query,
      limit: paginator.queryLimit,
      cursor: cursor?.toISOString(),
    });

    return paginator.extractPage(posts);
  }
}
