import { createKeyvRedis } from "@repo/common/infrastructure";
import Keyv from "keyv";

import type { ILabelCursorStore } from "../application/interfaces/label-cursor-store.js";

export class LabelCursorStore implements ILabelCursorStore {
  private readonly keyv: Keyv<number>;

  constructor(redisUrl: string) {
    this.keyv = new Keyv({
      namespace: "label-cursor",
      useKeyPrefix: false,
      store: createKeyvRedis<number>(redisUrl),
    });
  }

  getCursor(moderationUrl: string) {
    return this.keyv.get(moderationUrl);
  }

  async setCursor(moderationUrl: string, cursor: number) {
    await this.keyv.set(moderationUrl, cursor);
  }
}
