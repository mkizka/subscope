import type { Did } from "@atproto/did";
import type { $OutputBody } from "@repo/client/app/bsky/graph/getLists";

import type { ListDto } from "../../../application/dto/list-dto.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { IListQuery } from "../../interfaces/queries/list-query.js";
import type { ListViews } from "../../views/list-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetListsUseCase {
  constructor(
    private readonly deps: {
      listQuery: IListQuery;
      viewContextFactory: ViewContextFactory;
      listViews: ListViews;
    },
  ) {}

  async execute(params: {
    accountDid: Did;
    limit: number;
    cursor?: string;
    purposes?: string[];
  }): Promise<$OutputBody> {
    const paginator = createCursorPaginator<ListDto>({
      limit: params.limit,
      getCursor: (list) => list.createdAt.toISOString(),
    });

    const lists = await this.deps.listQuery.findByAccount({
      accountDid: params.accountDid,
      limit: paginator.queryLimit,
      cursor: params.cursor,
      purposes: params.purposes?.map(
        (purpose) => `app.bsky.graph.defs#${purpose}`,
      ),
    });
    const page = paginator.extractPage(lists);

    const ctx = this.deps.viewContextFactory.create();
    const views = await Promise.all(
      page.items.map((list) => this.deps.listViews.view(list.uri, ctx)),
    );
    return {
      cursor: page.cursor,
      lists: views.filter((view) => view !== undefined),
    };
  }
}
