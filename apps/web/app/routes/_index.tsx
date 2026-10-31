import { parseWithZod } from "@conform-to/zod/v4";
import { data, redirect } from "react-router";

import { didContext } from "@/app/context/did";
import { postSchema } from "@/app/features/timeline/blocks/post-form-container";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { TimelinePage } from "@/app/pages/client/timeline-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/_index";

export function meta() {
  return [
    { title: "Subscope - 省ストレージなBluesky互換AppView" },
    {
      name: "description",
      content: "Tapを利用して省ストレージを目指したBluesky互換のAppView",
    },
  ];
}

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;
  const timeline = await di.getTimelineUseCase
    .execute(context.get(didContext), cursor)
    .catch((e: unknown) => {
      di.loggerManager
        .createLogger("_index")
        .error(e, "Failed to get timeline");
      throw data("タイムラインの取得に失敗しました", { status: 500 });
    });
  if (!timeline) {
    throw redirect("/login");
  }
  return data(timeline);
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const submission = parseWithZod(await request.formData(), {
    schema: postSchema,
  });
  if (submission.status !== "success") {
    return data({ error: "投稿内容が不正です" }, { status: 400 });
  }
  const { text, image, alt, type, uri, cid, rootUri, rootCid } =
    submission.value;
  const subject = uri && cid ? { uri, cid } : undefined;
  const root = rootUri && rootCid ? { uri: rootUri, cid: rootCid } : subject;
  try {
    const postUri = await di.createPostUseCase.execute(
      context.get(didContext),
      {
        text,
        images: image.map((file, i) => ({ file, alt: alt[i] ?? "" })),
        reply:
          type === "reply" && subject && root
            ? { root, parent: subject }
            : undefined,
        quote: type === "quote" ? subject : undefined,
        allow: submission.value.threadgate ? submission.value.allow : undefined,
      },
    );
    return data({ uri: postUri });
  } catch (e) {
    di.loggerManager.createLogger("_index").error(e, "Failed to create post");
    return data({ error: "投稿に失敗しました" }, { status: 500 });
  }
};

export default function Home({ loaderData }: Route.ComponentProps) {
  return <TimelinePage posts={loaderData.posts} cursor={loaderData.cursor} />;
}

export { shouldRevalidate } from "@/app/lib/should-revalidate";
