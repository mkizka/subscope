import type { BackfillStatus } from "@repo/common/domain";

import { Badge } from "@/app/components/ui/badge";

const LABELS = {
  inProgress: "取り込み中",
  completed: "取り込み済み",
  error: "取り込みエラー",
};

export function BackfillStatusBadge({ status }: { status: BackfillStatus }) {
  return (
    <Badge variant={status === "error" ? "danger" : "status"}>
      {LABELS[status]}
    </Badge>
  );
}
