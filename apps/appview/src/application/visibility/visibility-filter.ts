import type { ProfileDetailed } from "@repo/common/domain";

import { isTakendown, type Label } from "../interfaces/label-repository.js";
import type { ViewData } from "../loader/actor-loader.js";

export const hiddenReason = (profile: ProfileDetailed, labels?: Label[]) => {
  if (profile.status === "deactivated") {
    return "AccountDeactivated";
  }
  if (profile.status !== "active" || isTakendown(labels)) {
    return "AccountTakedown";
  }
  return null;
};

export const filterVisible = (
  data: ViewData,
  { includeTakedowns = false } = {},
): ViewData => {
  if (includeTakedowns) {
    return data;
  }
  return {
    ...data,
    profiles: new Map(
      [...data.profiles].filter(
        ([did, profile]) => !hiddenReason(profile, data.labels.get(did)),
      ),
    ),
  };
};
