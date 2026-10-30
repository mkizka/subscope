import { isValidDid } from "@atproto/syntax";
import { useFetcher } from "react-router";
import { z } from "zodV4";

import { FollowButton } from "@/app/features/profile/parts/follow-button";
import type { action } from "@/app/routes/api.follows";

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
  const toggle = () => {
    if (fetcher.state === "submitting") return;
    void fetcher.submit(
      { did, followUri: followUri ?? "" },
      { method: "post", action: "/api/follows" },
    );
  };
  return <FollowButton following={following} onClick={toggle} />;
}
