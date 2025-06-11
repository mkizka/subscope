import type { IProfileRepository } from "./interfaces/profile-repository.js";
import type { ProfileViewService } from "./service/profile-view-service.js";

export class SearchActorsUseCase {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly profileViewService: ProfileViewService,
  ) {}
  static inject = ["profileRepository", "profileViewService"] as const;

  async execute(params: { q?: string; limit: number; cursor?: string }) {
    const query = params.q;
    if (!query) {
      return {
        actors: [],
        cursor: undefined,
      };
    }

    const limit = params.limit;
    const searchResult = await this.profileRepository.search(
      query,
      limit,
      params.cursor,
    );

    const actors = this.profileViewService.convertToProfileViews(
      searchResult.profiles,
    );

    return {
      actors,
      cursor: searchResult.cursor,
    };
  }
}
