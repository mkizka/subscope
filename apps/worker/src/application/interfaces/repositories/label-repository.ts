import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";

export type LabelData = {
  src: string;
  uri: string;
  cid?: string;
  val: string;
  neg?: boolean;
  cts: string;
  exp?: string;
};

export interface ILabelRepository {
  save: (params: {
    ctx: TransactionContext;
    label: LabelData;
    actorDid: Did;
  }) => Promise<void>;
  delete: (params: {
    ctx: TransactionContext;
    label: LabelData;
  }) => Promise<void>;
}
