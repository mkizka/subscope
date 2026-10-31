import type { ProfileDetailed } from "@repo/common/domain";

import type { LabelDto } from "../dto/label-dto.js";
import { isTakendown } from "../interfaces/label-query.js";
import type { ViewData } from "../loader/actor-loader.js";

export const hiddenReason = (profile: ProfileDetailed, labels?: LabelDto[]) => {
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
