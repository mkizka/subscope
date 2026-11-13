import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { Block } from "../../../application/dto/block.js";
import type { IBlockRepository } from "../../../application/interfaces/repositories/block-repository.js";

export class InMemoryBlockRepository implements IBlockRepository {
  private blocks: Map<string, Block> = new Map();

  async find({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<Block | null> {
    return this.blocks.get(uri.toString()) ?? null;
  }

  async save({ block }: { ctx: TransactionContext; block: Block }) {
    this.blocks.set(block.uri, block);
  }
}
