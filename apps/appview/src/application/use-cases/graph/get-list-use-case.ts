import type { AtUri } from "@atproto/syntax";
import type { $OutputBody } from "@repo/client/lex/app/bsky/graph/getList";
import type { ListItem } from "@repo/common/domain";

import type { IListRepository } from "../../../application/interfaces/list-repository.js";
import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";
import type { ListViewService } from "../../../application/service/graph/list-view-service.js";
import { toMapByDid } from "../../../application/utils/map.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";

export class GetListUseCase {
  constructor(
    private readonly listRepository: IListRepository,
    private readonly listViewService: ListViewService,
    private readonly profileViewService: ProfileViewService,
  ) {}

  async execute(params: {
    listUri: AtUri;
    limit: number;
    cursor?: string;
  }): Promise<$OutputBody | null> {
    const list = await this.listRepository.findByUri(params.listUri);
    if (!list) return null;
    const [listView] = await this.listViewService.findListViews([list]);
    if (!listView) return null;

    const paginator = createCursorPaginator<ListItem>({
      limit: params.limit,
      getCursor: (item) => item.createdAt.toISOString(),
    });
    const page = paginator.extractPage(
      await this.listRepository.findItems({
        listUri: params.listUri,
        limit: paginator.queryLimit,
        cursor: params.cursor,
      }),
    );
    const profileMap = await this.profileViewService
      .findProfileView(page.items.map((item) => item.subjectDid))
      .then(toMapByDid);

    return {
      cursor: page.cursor,
      list: listView,
      items: page.items.flatMap((item) => {
        const subject = profileMap.get(item.subjectDid);
        return subject ? { uri: item.uri.toString(), subject } : [];
      }),
    };
  }
}
