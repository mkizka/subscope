import { isValidHandle } from "@atproto/syntax";
import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string({ error: "入力は必須です" }).refine(isValidHandle, {
    message: "有効な形式のハンドルを入力してください (例: example.bsky.social)",
  }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
