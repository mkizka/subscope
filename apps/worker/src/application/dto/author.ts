import type { Did } from "@atproto/did";

import type { Tracking } from "../../domain/tracking.js";

export type Author = { did: Did; isMember: boolean; tracking: Tracking | null };
