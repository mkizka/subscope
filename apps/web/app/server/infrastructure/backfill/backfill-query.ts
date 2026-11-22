import { Client } from "@atproto/lex";
import { isValidDid } from "@atproto/syntax";
import getTrackingStatuses from "@repo/client/me/subsco/sync/getTrackingStatuses";

import type { BackfillStatus } from "@/app/lib/backfill-status";
import type { IBackfillQuery } from "@/app/server/application/interfaces/backfill-query";
import type { Env } from "@/app/server/env";

const isBackfillStatus = (status: string): status is BackfillStatus =>
  status === "inProgress" || status === "completed" || status === "error";

export const backfillQueryFactory = ({
  env,
}: {
  env: Pick<Env, "APPVIEW_URL">;
}): IBackfillQuery => {
  const publicClient = new Client(env.APPVIEW_URL);
  return {
    async findTrackedStatuses(dids) {
      if (dids.length === 0) {
        return {};
      }
      const { statuses } = await publicClient.call(getTrackingStatuses, {
        dids: dids.filter(isValidDid),
      });
      const result: Record<string, BackfillStatus> = {};
      for (const { did, backfillStatus } of statuses) {
        if (isBackfillStatus(backfillStatus)) {
          result[did] = backfillStatus;
        }
      }
      return result;
    },
  };
};
