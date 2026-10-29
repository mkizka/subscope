import { useFetcher } from "react-router";

import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
import type { loader } from "@/app/routes/admin.invite-codes";

import {
  type InviteCode,
  InviteCodeRows,
  InviteCodeTable,
} from "./invite-code-table";

type DeleteProps = {
  onDeleteCode: (code: string) => void;
  deletingCode: string | null;
};

function OlderInviteCodeRowsContainer({
  cursor,
  ...deleteProps
}: DeleteProps & { cursor: string }) {
  const fetcher = useFetcher<typeof loader>();

  if (!fetcher.data) {
    return (
      <tbody>
        <tr>
          <td colSpan={6} className="text-center text-base-content/70">
            {fetcher.state !== "idle" && "読み込み中..."}
            <InfiniteScrollTrigger
              onIntersect={() =>
                void fetcher.load(
                  `/admin/invite-codes?${new URLSearchParams({ cursor })}`,
                )
              }
              enabled={fetcher.state === "idle"}
            />
          </td>
        </tr>
      </tbody>
    );
  }
  return (
    <>
      <InviteCodeRows codes={fetcher.data.codes} {...deleteProps} />
      {fetcher.data.cursor && (
        <OlderInviteCodeRowsContainer
          cursor={fetcher.data.cursor}
          {...deleteProps}
        />
      )}
    </>
  );
}

type Props = {
  codes: InviteCode[];
  cursor?: string;
};

export function InviteCodeTableContainer({ codes, cursor }: Props) {
  const createFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const deleteProps = {
    onDeleteCode: (code: string) =>
      void deleteFetcher.submit(
        { code },
        {
          method: "DELETE",
          action: "/admin/api/invite-codes",
          encType: "application/json",
        },
      ),
    deletingCode:
      deleteFetcher.state === "idle"
        ? null
        : // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          (deleteFetcher.json as { code: string }).code,
  };

  return (
    <InviteCodeTable
      codes={codes}
      onCreateCode={() =>
        void createFetcher.submit(null, {
          method: "POST",
          action: "/admin/api/invite-codes",
        })
      }
      isCreating={createFetcher.state !== "idle"}
      {...deleteProps}
    >
      {cursor && (
        <OlderInviteCodeRowsContainer cursor={cursor} {...deleteProps} />
      )}
    </InviteCodeTable>
  );
}
