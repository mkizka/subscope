import type { Repost } from "@repo/common/domain";

export interface IRepostRepository {
  findRepostsByPost: (params: {
    subjectUri: string;
    limit: number;
    cursor?: Date;
  }) => Promise<Repost[]>;
}
