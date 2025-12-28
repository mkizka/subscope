import type { Did } from "@atproto/did";

import type { SupportedCollection } from "../../utils/collection.js";
import type { Handle } from "../../utils/handle.js";

type CreateOrUpdateCommitEventDto<
  RecordType extends string = SupportedCollection,
> = {
  did: Did;
  live: boolean;
  commit: {
    operation: "create" | "update";
    collection: RecordType;
    rkey: string;
    record: unknown;
    cid: string;
  };
};

type DeleteCommitEventDto<RecordType extends string = SupportedCollection> = {
  did: Did;
  live: boolean;
  commit: {
    operation: "delete";
    collection: RecordType;
    rkey: string;
  };
};

export type CommitEventDto<RecordType extends string = SupportedCollection> =
  | CreateOrUpdateCommitEventDto<RecordType>
  | DeleteCommitEventDto<RecordType>;

export interface AccountEventDto {
  account: {
    did: Did;
    active: boolean;
    status?: string;
  };
}

export interface IdentityEventDto {
  identity: {
    did: Did;
    handle?: Handle;
  };
}
