import type { LabelDto } from "../dto/label-dto.js";

export interface ILabelQuery {
  findBySubjects: (uris: string[]) => Promise<LabelDto[]>;
}

const TAKEDOWN_VALS = ["!takedown", "!suspend"];

export const isTakendown = (labels: LabelDto[] = []) =>
  labels.some((label) => TAKEDOWN_VALS.includes(label.val));
