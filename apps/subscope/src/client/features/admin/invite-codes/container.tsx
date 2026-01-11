import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "preact/hooks";

import { queryClient, trpc } from "../../../lib/trpc.js";
import { InviteCodesPresenter } from "./presenter.js";

export function InviteCodesContainer() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery(
    trpc.inviteCodes.list.queryOptions({ limit: 20 }),
  );

  const createMutation = useMutation(
    trpc.inviteCodes.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.inviteCodes.list.queryKey(),
        });
      },
    }),
  );

  const handleGenerateInviteCode = () => {
    createMutation.mutate();
  };

  const handleCopyToClipboard = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (isLoading) {
    return <div className="p-4 text-on-surface-variant">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-error">
        エラーが発生しました: {error.message}
      </div>
    );
  }

  return (
    <InviteCodesPresenter
      inviteCodes={data?.codes ?? []}
      copiedCode={copiedCode}
      onGenerateInviteCode={handleGenerateInviteCode}
      onCopyToClipboard={handleCopyToClipboard}
    />
  );
}
