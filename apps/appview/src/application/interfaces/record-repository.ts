import type { AtUri } from "@atproto/syntax";
import type { Record } from "@dawn/common/domain";

export interface IRecordRepository {
  findMany: (uris: AtUri[]) => Promise<Record[]>;
}
