import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { z } from "zodV4";

import type { action } from "@/app/routes/_index";

import {
  countGraphemes,
  MAX_IMAGES,
  MAX_POST_LENGTH,
  PostForm,
  REPLY_RULES,
} from "./post-form";

export const postSchema = z
  .object({
    text: z
      .string()
      .default("")
      .refine((text) => countGraphemes(text) <= MAX_POST_LENGTH),
    image: z.array(z.instanceof(File)).max(MAX_IMAGES).default([]),
    alt: z.array(z.string().default("")).default([]),
    type: z.enum(["reply", "quote"]).optional(),
    uri: z.string().optional(),
    cid: z.string().optional(),
    rootUri: z.string().optional(),
    rootCid: z.string().optional(),
    threadgate: z.boolean().default(false),
    allow: z.array(z.enum(REPLY_RULES.map(({ rule }) => rule))).default([]),
  })
  .refine(({ text, image }) => text.trim() !== "" || image.length > 0);

export type ComposeTarget = {
  type: "reply" | "quote";
  uri: string;
  cid: string;
  handle: string;
  root?: { uri: string; cid: string };
  onPosted?: () => void;
};

type Props = {
  target?: ComposeTarget;
  onClearTarget: () => void;
};

export function PostFormContainer({ target, onClearTarget }: Props) {
  const fetcher = useFetcher<typeof action>();
  const [posted, setPosted] = useState<{
    uri: string;
    target?: ComposeTarget;
  }>();
  const uri = fetcher.data && "uri" in fetcher.data && fetcher.data.uri;
  if (uri && uri !== posted?.uri) {
    setPosted({ uri, target });
  }
  useEffect(() => posted?.target?.onPosted?.(), [posted]);
  const current = posted?.target === target ? undefined : target;
  return (
    <PostForm
      key={posted?.uri}
      context={
        current &&
        `@${current.handle} ${current.type === "reply" ? "に返信" : "を引用"}`
      }
      onCancelContext={onClearTarget}
      isSubmitting={fetcher.state !== "idle"}
      error={
        fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined
      }
      onSubmit={(formData) => {
        if (current) {
          formData.set("type", current.type);
          formData.set("uri", current.uri);
          formData.set("cid", current.cid);
          formData.set("rootUri", current.root?.uri ?? "");
          formData.set("rootCid", current.root?.cid ?? "");
        }
        return fetcher.submit(formData, {
          method: "POST",
          action: "/?index",
          encType: "multipart/form-data",
        });
      }}
    />
  );
}
