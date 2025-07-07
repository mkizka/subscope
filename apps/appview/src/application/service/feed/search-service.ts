import type { Post } from "@repo/common/domain";
import { required } from "@repo/common/utils";

import type { IPostRepository } from "../../interfaces/post-repository.js";
import { createCursorPaginator, type Page } from "../../utils/pagination.js";

export class SearchService {
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
      // TODO: PostのsortAtを必須にする
      getCursor: (post) => required(post.sortAt?.toISOString()),
    });

    const posts = await this.postRepository.search({
      query,
      limit: paginator.queryLimit,
      cursor: cursor?.toISOString(),
    });

    return paginator.extractPage(posts);
  }
}
