import type { Did } from "@atproto/did";
import type * as MeSubscoAdminGetBannedActors from "@repo/client/lex/me/subsco/admin/getBannedActors";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetBannedActorsUseCase {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
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
    const ctx = this.viewContextFactory.create({ includeTakedowns: true });
    const actors = await Promise.all(
      page.items.map((did) => this.profileViews.view(did, ctx)),
    );

    return {
      cursor: page.cursor,
      actors: actors.filter((actor) => actor !== undefined),
    };
  }
}
