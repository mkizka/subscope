import type { AtIdentifierString } from "@atproto/syntax";

export interface IFollowQuery {
  findRegisteredFollowers: (subject: AtIdentifierString) => Promise<string[]>;
}
