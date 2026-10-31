import { isAtIdentifierString, isAtUriString } from "@atproto/syntax";
import { useFetcher } from "react-router";
import { z } from "zodV4";

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
      className="flex gap-2 border-b border-base-300 p-4"
    >
      <input type="hidden" name="listUri" value={listUri} />
      <input
        name="handle"
        aria-label="ハンドル"
        placeholder="alice.bsky.social"
        className="input w-full"
        required
      />
      <button type="submit" className="btn btn-primary">
        追加する
      </button>
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
      <button type="submit" className="btn btn-ghost btn-sm">
        削除
      </button>
    </fetcher.Form>
  );
}
