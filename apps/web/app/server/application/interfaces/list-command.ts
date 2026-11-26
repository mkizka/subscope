import type { AtUriString } from "@atproto/syntax";

type ListInput = { name: string; description?: string };

export interface IListCommand {
  create: (did: string, input: ListInput) => Promise<void>;
  update: (
    did: string,
    params: { rkey: string; input: ListInput },
  ) => Promise<void>;
  addMember: (
    did: string,
    params: { listUri: AtUriString; subject: `did:${string}:${string}` },
  ) => Promise<void>;
  removeMember: (did: string, listItemUri: string) => Promise<void>;
  delete: (did: string, rkey: string) => Promise<void>;
}
