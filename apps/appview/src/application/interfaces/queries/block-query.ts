import type { Did } from "@atproto/did";

import type { BlockDto } from "../../dto/block-dto.js";

export interface IBlockQuery {
  findBlocks: (params: {
    accountDids: Did[];
    subjectDids: Did[];
  }) => Promise<BlockDto[]>;
}
