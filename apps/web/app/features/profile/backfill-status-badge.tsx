import { Badge } from "@/app/components/ui/badge";
import type { BackfillStatus } from "@/app/lib/backfill-status";

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
