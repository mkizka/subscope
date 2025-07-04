import KeyvRedis from "@keyv/redis";
import Keyv from "keyv";

import type { ICursorRepository } from "../application/interfaces/cursor-repository.js";

const CURSOR_KEY = "cursor";

export class RedisCursorRepository implements ICursorRepository {
  private readonly cache: Keyv<number>;

  constructor(redisUrl: string) {
    this.cache = new Keyv<number>({
      namespace: "jetstream",
      // https://github.com/jaredwray/keyv/issues/1255
      useKeyPrefix: false,
      store: new KeyvRedis(redisUrl),
    });
  }
  static inject = ["redisUrl"] as const;

  async set(cursor: number): Promise<void> {
    await this.cache.set(CURSOR_KEY, cursor);
  }

  async get(): Promise<number | null> {
    const cursor = await this.cache.get(CURSOR_KEY);
    return cursor ?? null;
  }
}
