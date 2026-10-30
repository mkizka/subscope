import type { Did } from "@atproto/did";
import type * as MeSubscoAdminGetBannedActors from "@repo/client/lex/me/subsco/admin/getBannedActors";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";
import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";

export class GetBannedActorsUseCase {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly profileViewService: ProfileViewService,
  ) {}

  async execute(params: {
    limit: number;
    cursor?: string;
  }): Promise<MeSubscoAdminGetBannedActors.$OutputBody> {
    const paginator = createCursorPaginator<Did>({
      limit: params.limit,
      getCursor: (did) => did,
    });
    const page = paginator.extractPage(
      await this.actorRepository.findBannedDids({
        limit: paginator.queryLimit,
        cursor: params.cursor,
      }),
    );
    const actors = await this.profileViewService.findProfileView(
      page.items,
      null,
      {
        includeTakedowns: true,
      },
    );

    return { cursor: page.cursor, actors };
  }
}
