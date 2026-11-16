import type { PostThreadService } from "../../service/feed/post-thread-service.js";

export class GetPostThreadUseCase {
  constructor(private readonly postThreadService: PostThreadService) {}

  execute(params: Parameters<PostThreadService["build"]>[0]) {
    return this.postThreadService.build(params);
  }
}
