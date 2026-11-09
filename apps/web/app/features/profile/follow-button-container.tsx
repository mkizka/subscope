import { isValidDid } from "@atproto/syntax";
import { useFetcher } from "react-router";
import { z } from "zodV4";

import type { action } from "@/app/routes/api.follows";

import { FollowButton } from "./follow-button";

export const followSchema = z.object({
  did: z.string().refine(isValidDid),
  followUri: z.string().optional(),
});

type Props = {
  did: string;
  viewerFollowing?: string;
};

export function FollowButtonContainer({ did, viewerFollowing }: Props) {
  const fetcher = useFetcher<typeof action>();
  const followUri = fetcher.data ? fetcher.data.uri : viewerFollowing;
  const following = fetcher.formData
    ? !fetcher.formData.get("followUri")
    : !!followUri;
  const busy = fetcher.state !== "idle";
  const toggle = () => {
    if (busy) return;
    void fetcher.submit(
      { did, followUri: followUri ?? "" },
      { method: "post", action: "/api/follows" },
    );
  };
  return <FollowButton following={following} busy={busy} onClick={toggle} />;
}
