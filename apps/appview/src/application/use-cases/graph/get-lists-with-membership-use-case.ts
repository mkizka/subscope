import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { $OutputBody } from "@repo/client/app/bsky/graph/getListsWithMembership";

import type { ListDto } from "../../../application/dto/list-dto.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { IListQuery } from "../../interfaces/queries/list-query.js";
import type { ListViews } from "../../views/list-views.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

const SUPPORTED_PURPOSES = ["curatelist", "modlist"];

export class GetListsWithMembershipUseCase {
  constructor(
    private readonly listQuery: IListQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly listViews: ListViews,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(params: {
    viewerDid: Did;
    subjectDid: Did;
    limit: number;
    cursor?: string;
    purposes?: string[];
  }): Promise<$OutputBody> {
    const paginator = createCursorPaginator<ListDto>({
      limit: params.limit,
      getCursor: (list) => list.createdAt.toISOString(),
    });
    const lists = await this.listQuery.findByAccount({
      accountDid: params.viewerDid,
      limit: paginator.queryLimit,
      cursor: params.cursor,
      purposes: (params.purposes ?? SUPPORTED_PURPOSES).map(
        (purpose) => `app.bsky.graph.defs#${purpose}`,
      ),
    });
    const page = paginator.extractPage(lists);

    const items = await this.listQuery.findItemsBySubject({
      listUris: page.items.map((list) => new AtUri(list.uri)),
      subjectDid: params.subjectDid,
    });
    const ctx = this.viewContextFactory.create();
    const subject = await this.profileViews.view(params.subjectDid, ctx);

    const listsWithMembership = await Promise.all(
      page.items.map(async (list) => {
        const view = await this.listViews.view(list.uri, ctx);
        if (!view) return undefined;
        const item = items.find((item) => item.listUri === list.uri);
        return {
          list: view,
          listItem: item && subject ? { uri: item.uri, subject } : undefined,
        };
      }),
    );
    return {
      cursor: page.cursor,
      listsWithMembership: listsWithMembership.filter(
        (entry) => entry !== undefined,
      ),
    };
  }
}
