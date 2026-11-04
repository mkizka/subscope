import type { AtIdentifierString } from "@atproto/syntax";

export interface IFollowQuery {
  findRegisteredFollowers: (
    subject: AtIdentifierString,
    limit: number,
  ) => Promise<{ total: number; dids: string[] }>;
}
