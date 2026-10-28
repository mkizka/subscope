import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { List, ListItem } from "@repo/common/domain";

export interface IListRepository {
  findByActor: (params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
    purposes?: string[];
  }) => Promise<List[]>;
  findByUri: (uri: AtUri) => Promise<List | null>;
  findItems: (params: {
    listUri: AtUri;
    limit: number;
    cursor?: string;
  }) => Promise<ListItem[]>;
}
