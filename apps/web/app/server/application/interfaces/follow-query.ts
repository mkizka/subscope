import type { AtIdentifierString } from "@atproto/syntax";

export interface IFollowQuery {
  findMemberFollowers: (subject: AtIdentifierString) => Promise<string[]>;
}
