import { Client } from "@atproto/lex";
import { isValidDid } from "@atproto/syntax";
import getBackfillStatuses from "@repo/client/me/subsco/sync/getBackfillStatuses";
import type { BackfillStatus } from "@repo/common/domain";

import { env } from "@/app/server/env";

const isBackfillStatus = (status: string): status is BackfillStatus =>
  status === "inProgress" || status === "completed" || status === "error";

export interface IBackfillQuery {
  findTrackedStatuses: (
    dids: string[],
  ) => Promise<Record<string, BackfillStatus>>;
}

export const backfillQueryFactory = (): IBackfillQuery => {
  const publicClient = new Client(env.APPVIEW_URL);
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
