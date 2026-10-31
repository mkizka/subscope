export type Label = {
  src: string;
  uri: string;
  val: string;
};

export interface ILabelRepository {
  findBySubjects: (uris: string[]) => Promise<Label[]>;
}
