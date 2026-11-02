import type { Did } from "@atproto/did";

export type BackfillStatus = "inProgress" | "completed" | "error";

export interface IBackfillStatusQuery {
  findWithFollows: (dids: Did[]) => Promise<Map<Did, BackfillStatus>>;
}
