import { createKeyvRedis } from "@repo/common/infrastructure";
import Keyv from "keyv";

import type { ILabelCursorStore } from "../../application/interfaces/external/label-cursor-store.js";
import type { Env } from "../../shared/env.js";

export class LabelCursorStore implements ILabelCursorStore {
  private readonly keyv: Keyv<number>;

  constructor(env: Pick<Env, "REDIS_URL">) {
    this.keyv = new Keyv({
      namespace: "label-cursor",
      useKeyPrefix: false,
      store: createKeyvRedis<number>(env.REDIS_URL),
    });
  }

  getCursor(moderationUrl: string) {
    return this.keyv.get(moderationUrl);
  }

  async setCursor(moderationUrl: string, cursor: number) {
    await this.keyv.set(moderationUrl, cursor);
  }
}
