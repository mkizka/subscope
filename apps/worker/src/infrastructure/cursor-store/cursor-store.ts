import { createKeyvRedis } from "@repo/common/infrastructure";
import Keyv from "keyv";

import type { ICursorStore } from "../../application/interfaces/external/cursor-store.js";
import type { Env } from "../../shared/env.js";

export class CursorStore implements ICursorStore {
  private readonly keyv: Keyv<number>;

  constructor(env: Pick<Env, "REDIS_URL">) {
    this.keyv = new Keyv({
      namespace: "cursor",
      useKeyPrefix: false,
      store: createKeyvRedis<number>(env.REDIS_URL),
    });
  }

  getCursor(url: string) {
    return this.keyv.get(url);
  }

  async setCursor(url: string, cursor: number) {
    await this.keyv.set(url, cursor);
  }
}
