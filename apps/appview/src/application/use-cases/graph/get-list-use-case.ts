import type { AtUri } from "@atproto/syntax";
import type { $OutputBody } from "@repo/client/lex/app/bsky/graph/getList";

import type { ListItemDto } from "../../../application/dto/list-dto.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { IListQuery } from "../../interfaces/queries/list-query.js";
import type { ListViews } from "../../views/list-views.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetListUseCase {
  constructor(
    private readonly listQuery: IListQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly listViews: ListViews,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(params: {
    listUri: AtUri;
    limit: number;
    cursor?: string;
  }): Promise<$OutputBody | null> {
    const ctx = this.viewContextFactory.create();
    const list = await this.listViews.view(params.listUri.toString(), ctx);
    if (!list) return null;

    const paginator = createCursorPaginator<ListItemDto>({
      limit: params.limit,
      getCursor: (item) => item.createdAt.toISOString(),
    });
    const page = paginator.extractPage(
      await this.listQuery.findItems({
        listUri: params.listUri,
        limit: paginator.queryLimit,
        cursor: params.cursor,
      }),
    );
    const items = await Promise.all(
      page.items.map(async (item) => {
        const subject = await this.profileViews.view(item.subjectDid, ctx);
        return subject && { uri: item.uri, subject };
      }),
    );

    return {
      cursor: page.cursor,
      list,
      items: items.filter((item) => item !== undefined),
    };
  }
}
