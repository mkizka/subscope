import type { Did } from "@atproto/did";

export type Tracking = {
  did: Did;
  trackedAt: Date;
};

export const PAST_RECORD_WINDOW_MS = 24 * 60 * 60 * 1000;

export const isOutsidePastRecordWindow = (
  tracking: Tracking,
  createdAt: Date,
) => createdAt.getTime() < tracking.trackedAt.getTime() - PAST_RECORD_WINDOW_MS;
