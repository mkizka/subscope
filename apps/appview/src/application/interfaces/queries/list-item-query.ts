import type { Did } from "@atproto/did";

import type { ListItemDto } from "../../dto/list-item-dto.js";

export interface IListItemQuery {
  findItems: (params: {
    listUris: string[];
    subjectDid: Did;
  }) => Promise<ListItemDto[]>;
}
