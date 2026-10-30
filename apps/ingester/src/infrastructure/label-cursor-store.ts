import { createKeyvRedis } from "@repo/common/infrastructure";
import Keyv from "keyv";

export class LabelCursorStore extends Keyv<number> {
  constructor(redisUrl: string) {
    super({
      namespace: "label-cursor",
      useKeyPrefix: false,
      store: createKeyvRedis<number>(redisUrl),
    });
  }
}
