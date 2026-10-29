import { useState } from "react";
import { useFetcher } from "react-router";

import type { action } from "@/app/routes/_index";

import { PostForm } from "./post-form";

export function PostFormContainer() {
  const fetcher = useFetcher<typeof action>();
  const [postedUri, setPostedUri] = useState<string>();
  const uri = fetcher.data && "uri" in fetcher.data && fetcher.data.uri;
  if (uri && uri !== postedUri) {
    setPostedUri(uri);
  }
  return (
    <PostForm
      key={postedUri}
      isSubmitting={fetcher.state !== "idle"}
      error={
        fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined
      }
      onSubmit={(formData) =>
        fetcher.submit(formData, {
          method: "POST",
          action: "/?index",
          encType: "multipart/form-data",
        })
      }
    />
  );
}
