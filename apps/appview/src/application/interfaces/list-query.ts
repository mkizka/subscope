import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

import type { ListDto, ListItemDto } from "../dto/list-dto.js";

export interface IListQuery {
  findByActor: (params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
    purposes?: string[];
  }) => Promise<ListDto[]>;
  findByUris: (uris: AtUri[]) => Promise<ListDto[]>;
  findItems: (params: {
    listUri: AtUri;
    limit: number;
    cursor?: string;
  }) => Promise<ListItemDto[]>;
}
