import type { BackfillStatus } from "@repo/common/domain";

import { Badge } from "@/app/components/ui/badge";

const LABELS = {
  inProgress: "同期中",
  completed: "同期済み",
  error: "同期エラー",
};

export function BackfillStatusBadge({ status }: { status: BackfillStatus }) {
  return (
    <Badge variant={status === "error" ? "danger" : "status"}>
      {LABELS[status]}
    </Badge>
  );
}
