import type {
  ILabelRepository,
  Label,
} from "../../application/interfaces/label-repository.js";

export class InMemoryLabelRepository implements ILabelRepository {
  private labels: Label[] = [];

  add(label: Label): void {
    this.labels.push(label);
  }

  clear(): void {
    this.labels = [];
  }

  findBySubjects(uris: string[]): Promise<Label[]> {
    return Promise.resolve(
      this.labels.filter((label) => uris.includes(label.uri)),
    );
  }
}
