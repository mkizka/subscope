import type { Like } from "@repo/common/domain";

export interface ILikeRepository {
  findMany: (params: {
    subjectUri: string;
    limit: number;
    cursor?: string;
  }) => Promise<Like[]>;
}
