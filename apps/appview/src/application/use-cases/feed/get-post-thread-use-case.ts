import type { PostThreadService } from "../../service/feed/post-thread-service.js";

export class GetPostThreadUseCase {
  constructor(private readonly postThreadService: PostThreadService) {}

  execute(params: Parameters<PostThreadService["execute"]>[0]) {
    return this.postThreadService.execute(params);
  }
}
