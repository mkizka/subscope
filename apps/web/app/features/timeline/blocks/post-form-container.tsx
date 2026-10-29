import { useState } from "react";
import { useFetcher } from "react-router";

import type { action } from "@/app/routes/_index";

import { PostForm } from "./post-form";

export type ComposeTarget = {
  type: "reply" | "quote";
  uri: string;
  cid: string;
  handle: string;
  root?: { uri: string; cid: string };
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
