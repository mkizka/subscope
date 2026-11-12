import { useQuery } from "@tanstack/react-query";
import { EllipsisIcon, ListPlusIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Menu, menuItemClass } from "@/app/components/ui/menu";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.list-membership.$did";

import { AddToListDialog } from "./add-to-list-dialog";

type MembershipResponse = Awaited<ReturnType<typeof loader>>["data"];

export function AddToListContainer({ did }: { did: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["listMembership", did],
    queryFn: () => fetchJson<MembershipResponse>(`/api/list-membership/${did}`),
    enabled: open,
    throwOnError: true,
  });

  return (
    <>
      <Menu label="その他" trigger={<EllipsisIcon className="size-4" />}>
        <button
          type="button"
          className={menuItemClass}
          onClick={() => {
            setOpen(true);
            ref.current?.showModal();
          }}
        >
          <ListPlusIcon className="size-4" />
          リストに追加
        </button>
      </Menu>
      <AddToListDialog
        ref={ref}
        did={did}
        lists={data?.lists}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
