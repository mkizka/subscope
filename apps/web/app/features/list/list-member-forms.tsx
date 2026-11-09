import { isAtIdentifierString, isAtUriString } from "@atproto/syntax";
import { useFetcher } from "react-router";
import { z } from "zodV4";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

export const addListMemberSchema = z.object({
  listUri: z.string().refine(isAtUriString),
  handle: z.string().trim().refine(isAtIdentifierString),
});

export const removeListMemberSchema = z.object({
  listItemUri: z.string().refine(isAtUriString),
});

export function AddListMemberForm({ listUri }: { listUri: string }) {
  const fetcher = useFetcher();
  return (
    <fetcher.Form
      method="post"
      action="/api/list-members"
      className="flex gap-2 border-b border-line p-4"
    >
      <input type="hidden" name="listUri" value={listUri} />
      <div className="flex-1">
        <Input
          name="handle"
          aria-label="ハンドル"
          placeholder="alice.bsky.social"
          required
        />
      </div>
      <Button type="submit" loading={fetcher.state !== "idle"}>
        追加する
      </Button>
    </fetcher.Form>
  );
}

export function RemoveListMemberButton({
  listItemUri,
}: {
  listItemUri: string;
}) {
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="delete" action="/api/list-members">
      <input type="hidden" name="listItemUri" value={listItemUri} />
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        loading={fetcher.state !== "idle"}
      >
        削除
      </Button>
    </fetcher.Form>
  );
}
