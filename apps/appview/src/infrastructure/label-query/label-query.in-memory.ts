import type { LabelDto } from "../../application/dto/label-dto.js";
import type { ILabelQuery } from "../../application/interfaces/label-query.js";

export class InMemoryLabelQuery implements ILabelQuery {
  private labels: LabelDto[] = [];

  add(label: LabelDto): void {
    this.labels.push(label);
  }

  findBySubjects(uris: string[]): Promise<LabelDto[]> {
    return Promise.resolve(
      this.labels.filter((label) => uris.includes(label.uri)),
    );
  }
}
