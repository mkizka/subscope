export type Label = {
  src: string;
  uri: string;
  val: string;
};

export interface ILabelRepository {
  findBySubjects: (uris: string[]) => Promise<Label[]>;
}

const TAKEDOWN_VALS = ["!takedown", "!suspend"];

export const isTakendown = (labels: Label[] = []) =>
  labels.some((label) => TAKEDOWN_VALS.includes(label.val));
