import type { Did } from "@atproto/did";
import type { AtUri, AtUriString } from "@atproto/syntax";

import type { ListDto, ListItemDto } from "../../dto/list-dto.js";

export interface IListQuery {
  findByAccount: (params: {
    accountDid: Did;
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
  findItemsBySubject: (params: {
    listUris: AtUri[];
    subjectDid: Did;
  }) => Promise<(ListItemDto & { listUri: AtUriString })[]>;
}
