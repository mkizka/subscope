import type { Did } from "@atproto/did";
import type { $OutputBody } from "@repo/client/lex/app/bsky/graph/getLists";
import type { List } from "@repo/common/domain";

import type { IListRepository } from "../../../application/interfaces/list-repository.js";
import type { ListViewService } from "../../../application/service/graph/list-view-service.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";

export class GetListsUseCase {
  constructor(
    private readonly listRepository: IListRepository,
    private readonly listViewService: ListViewService,
  ) {}

  async execute(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
    purposes?: string[];
  }): Promise<$OutputBody> {
    const paginator = createCursorPaginator<List>({
      limit: params.limit,
      getCursor: (list) => list.createdAt.toISOString(),
    });

    const lists = await this.listRepository.findByActor({
      actorDid: params.actorDid,
      limit: paginator.queryLimit,
      cursor: params.cursor,
      purposes: params.purposes?.map(
        (purpose) => `app.bsky.graph.defs#${purpose}`,
      ),
    });
    const page = paginator.extractPage(lists);

    return {
      cursor: page.cursor,
      lists: await this.listViewService.findListViews(page.items),
    };
  }
}
