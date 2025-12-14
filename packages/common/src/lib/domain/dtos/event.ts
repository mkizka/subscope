import type { Did } from "@atproto/did";

import type { SupportedCollection } from "../../utils/collection.js";
import type { Handle } from "../../utils/handle.js";

type CreateOrUpdateCommitEventDto<
  RecordType extends string = SupportedCollection,
> = {
  did: Did;
  time_us: number;
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
  time_us: number;
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
  time_us: number;
  account: {
    did: Did;
    active: boolean;
    status?: string;
  };
}

export interface IdentityEventDto {
  time_us: number;
  identity: {
    did: Did;
    handle?: Handle;
  };
}
