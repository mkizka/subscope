import { Client } from "@atproto/lex";
import { isValidDid } from "@atproto/syntax";
import getBackfillStatuses from "@repo/client/me/subsco/sync/getBackfillStatuses";

import type { BackfillStatus } from "@/app/lib/backfill-status";
import type { IBackfillQuery } from "@/app/server/application/interfaces/backfill-query";

const isBackfillStatus = (status: string): status is BackfillStatus =>
  status === "inProgress" || status === "completed" || status === "error";

export const backfillQueryFactory = ({
  appviewUrl,
}: {
  appviewUrl: string;
}): IBackfillQuery => {
  const publicClient = new Client(appviewUrl);
  return {
    async findTrackedStatuses(dids) {
      if (dids.length === 0) {
        return {};
      }
      const { statuses } = await publicClient.call(getBackfillStatuses, {
        dids: dids.filter(isValidDid),
      });
      const result: Record<string, BackfillStatus> = {};
      for (const { did, status } of statuses) {
        if (isBackfillStatus(status)) {
          result[did] = status;
        }
      }
      return result;
    },
  };
};
