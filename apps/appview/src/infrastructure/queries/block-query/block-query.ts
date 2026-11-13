import { asDid, type Did } from "@atproto/did";
import { asAtUriString } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/interface";
import { schema } from "@repo/db";
import { and, inArray } from "drizzle-orm";

import type { BlockDto } from "../../../application/dto/block-dto.js";
import type { IBlockQuery } from "../../../application/interfaces/queries/block-query.js";

export class BlockQuery implements IBlockQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findBlocks(params: {
    accountDids: Did[];
    subjectDids: Did[];
  }): Promise<BlockDto[]> {
    if (params.accountDids.length === 0 || params.subjectDids.length === 0) {
      return [];
    }
    const blocks = await this.db.query.blocks.findMany({
      where: and(
        inArray(schema.blocks.accountDid, params.accountDids),
        inArray(schema.blocks.subjectDid, params.subjectDids),
      ),
    });
    return blocks.map((block) => ({
      uri: asAtUriString(block.uri),
      accountDid: asDid(block.accountDid),
      subjectDid: asDid(block.subjectDid),
    }));
  }
}
