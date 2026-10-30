import { isTakendown } from "../interfaces/label-repository.js";
import type { ViewData } from "../loader/actor-loader.js";

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
      [...data.profiles].filter(([did]) => !isTakendown(data.labels.get(did))),
    ),
  };
};
