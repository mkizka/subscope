import { useQuery } from "@tanstack/react-query";
import { useState } from "preact/hooks";

import { trpc } from "../../../lib/trpc.js";
import type { InviteCode } from "./presenter.js";
import { InviteCodesPresenter } from "./presenter.js";

export function InviteCodesContainer() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery(
    trpc.inviteCodes.list.queryOptions({ limit: 20 }),
  );

  const inviteCodes: InviteCode[] =
    data?.data.codes.map((code) => ({
      id: code.code,
      code: code.code,
      createdAt: code.createdAt.split("T")[0] ?? "",
      usedBy: code.usedBy?.handle ?? code.usedBy?.did ?? null,
      status:
        code.usedAt !== undefined ? ("使用済み" as const) : ("未使用" as const),
    })) ?? [];

  const handleGenerateInviteCode = () => {
    // TODO: 招待コード生成APIを呼び出す
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
      inviteCodes={inviteCodes}
      copiedCode={copiedCode}
      onGenerateInviteCode={handleGenerateInviteCode}
      onCopyToClipboard={handleCopyToClipboard}
    />
  );
}
