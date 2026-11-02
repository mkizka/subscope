import type { PostDto } from "../../../application/dto/post-dto.js";
import type { IPostQuery } from "../../../application/interfaces/post-query.js";
import {
  createCursorPaginator,
  type Page,
} from "../../../application/utils/pagination.js";

export class PostSearchService {
  constructor(private readonly postQuery: IPostQuery) {}

  async findPostsWithPagination({
    query,
    cursor,
    limit,
  }: {
    query: string;
    cursor?: Date;
    limit: number;
  }): Promise<Page<PostDto>> {
    const paginator = createCursorPaginator<PostDto>({
      limit,
      getCursor: (post) => post.sortAt.toISOString(),
    });

    const posts = await this.postQuery.search({
      query,
      limit: paginator.queryLimit,
      cursor,
    });

    return paginator.extractPage(posts);
  }
}
