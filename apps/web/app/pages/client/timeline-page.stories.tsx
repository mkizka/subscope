import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  expect,
  fireEvent,
  screen,
  userEvent,
  waitFor,
  within,
} from "storybook/test";

import { type Data, infinite, queryClient } from "@/.storybook/query-client";
import TimelineFeedStories from "@/app/features/timeline/timeline-feed.stories";
import type { loader as backfillStatusLoader } from "@/app/routes/api.backfill-status";
import type { loader as timelineLoader } from "@/app/routes/api.timeline";

import { TimelinePage } from "./timeline-page";

const meta = {
  beforeEach: () => {
    queryClient.setQueryData(
      ["timeline"],
      infinite<typeof timelineLoader>({
        posts: TimelineFeedStories.args.posts,
      }),
    );
  },
  component: TimelinePage,
  args: { local: false },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TimelinePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  beforeEach: () => {
    queryClient.setQueryData(
      ["timeline"],
      infinite<typeof timelineLoader>({ posts: [] }),
    );
  },
};

export const LongText: Story = {
  beforeEach: () => {
    queryClient.setQueryData(
      ["timeline"],
      infinite<typeof timelineLoader>({
        posts: [
          {
            uri: "at://did:plc:long/app.bsky.feed.post/1",
            cid: "bafylong",
            authorHandle:
              "very-long-handle-for-wrapping-check.example.bsky.social",
            authorDisplayName: "とても長い表示名".repeat(8),
            text: "長い文章です。".repeat(40) + "x".repeat(120),
            replyCount: 0,
            repostCount: 0,
            likeCount: 0,
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    );
  },
};

export const Local: Story = {
  args: { local: true },
  beforeEach: () => {
    queryClient.setQueryData(
      ["local-timeline"],
      infinite<typeof timelineLoader>({
        posts: TimelineFeedStories.args.posts,
      }),
    );
  },
};

const setBackfillStatus = (
  status: Data<typeof backfillStatusLoader>["status"],
) => {
  queryClient.setQueryData<Data<typeof backfillStatusLoader>>(
    ["backfill-status"],
    {
      status,
    },
  );
};

export const BackfillInProgress: Story = {
  name: "backfillBanner-s1: 自分の同期中は、「過去の投稿を同期しています」の帯を出す",
  tags: ["play"],
  beforeEach: () => setBackfillStatus("inProgress"),
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(/過去の投稿を同期しています/),
    ).toBeVisible();
  },
};

export const BackfillError: Story = {
  name: "backfillBanner-s2: 自分の同期がエラーなら、「過去の投稿を同期できていません」の帯を出す",
  tags: ["play"],
  beforeEach: () => setBackfillStatus("error"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(/過去の投稿を同期できていません/),
    ).toBeVisible();
    await expect(canvas.queryByText(/過去の投稿を同期しています/)).toBeNull();
  },
};

export const BackfillCompleted: Story = {
  name: "backfillBanner-s3: 自分の同期が終わっていれば、帯を出さない",
  tags: ["play"],
  beforeEach: () => setBackfillStatus("completed"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("tab", { name: "フォロー中" }),
    ).toBeVisible();
    await expect(canvas.queryByText(/過去の投稿を/)).toBeNull();
  },
};

const imagePost = (images: number) => ({
  uri: "at://did:plc:alice/app.bsky.feed.post/images",
  cid: "bafyimages",
  authorHandle: "alice.bsky.social",
  authorDisplayName: "Alice",
  text: "画像付きの投稿",
  replyCount: 0,
  repostCount: 0,
  likeCount: 0,
  createdAt: new Date().toISOString(),
  images: Array.from({ length: images }, (_, i) => ({
    thumb: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%23d97757'/%3E%3C/svg%3E#${i}`,
    fullsize: "",
    alt: "投稿画像",
    aspectRatio: { width: 1, height: 1 },
  })),
});

const setImagePost = (images: number) => () => {
  queryClient.setQueryData(
    ["timeline"],
    infinite<typeof timelineLoader>({ posts: [imagePost(images)] }),
  );
};

export const SingleImage: Story = {
  name: "post-images-s1: 画像が1枚のときは、投稿の幅いっぱいに表示する",
  tags: ["play"],
  beforeEach: setImagePost(1),
  play: async ({ canvasElement }) => {
    const post = within(canvasElement).getByRole("article");
    const image = await within(post).findByRole("img", { name: "投稿画像" });

    await expect(image.getBoundingClientRect().width).toBe(
      within(post).getByText("画像付きの投稿").getBoundingClientRect().width,
    );
  },
};

export const ManyImages: Story = {
  name: "post-images-s2: 画像が5枚以上のときは、横スクロールで表示する",
  tags: ["play"],
  beforeEach: setImagePost(5),
  play: async ({ canvasElement }) => {
    const post = within(canvasElement).getByRole("article");
    const [image] = await within(post).findAllByRole("img", {
      name: "投稿画像",
    });
    const scroller = image?.closest("button")?.parentElement;

    await expect(scroller).toBeTruthy();
    await expect(scroller?.scrollWidth).toBeGreaterThan(
      scroller?.clientWidth ?? 0,
    );
  },
};

const video = {
  playlist: "https://video.bsky.app/watch/did/cid/playlist.m3u8",
  thumbnail:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%23d97757'/%3E%3C/svg%3E",
  alt: "サンプル動画",
  aspectRatio: { width: 16, height: 9 },
};

const videoPost = {
  uri: "at://did:plc:alice/app.bsky.feed.post/video",
  cid: "bafyvideo",
  authorHandle: "alice.bsky.social",
  authorDisplayName: "Alice",
  text: "動画つきの投稿",
  createdAt: new Date().toISOString(),
};

const withVideoPosts = (post: object) => () => {
  queryClient.setQueryData(
    ["timeline"],
    infinite<typeof timelineLoader>({ posts: [{ ...videoPost, ...post }] }),
  );
};

const player = (canvasElement: HTMLElement) =>
  waitFor(async () => {
    const el = within(canvasElement).getByLabelText("サンプル動画");
    await expect(el).toHaveProperty("tagName", "HLS-VIDEO");
    return el;
  });

export const VideoCenteredPlay: Story = {
  name: "post-video-s1: 停止中は、動画の中央に再生ボタンを表示する",
  tags: ["play"],
  beforeEach: withVideoPosts({ video }),
  play: async ({ canvasElement }) => {
    await player(canvasElement);
    await expect(
      canvasElement.querySelector('[slot="centered-chrome"]'),
    ).toBeVisible();
  },
};

export const VideoTime: Story = {
  name: "post-video-s2: 再生ボタンの横に、経過時間と動画の長さを表示する",
  tags: ["play"],
  beforeEach: withVideoPosts({ video }),
  play: async ({ canvasElement }) => {
    await player(canvasElement);
    const bar = canvasElement.querySelector("media-control-bar");
    await expect(bar?.querySelector("media-play-button")).not.toBeNull();
    await expect(bar?.querySelector("media-time-display")).not.toBeNull();
  },
};

export const VideoThumbnailAndLabel: Story = {
  name: "post-video-s3: 動画はサムネイルを表示し、ALTをプレイヤーのラベルにする",
  tags: ["play"],
  beforeEach: withVideoPosts({ video }),
  play: async ({ canvasElement }) => {
    const el = await player(canvasElement);
    await expect(el).toHaveAttribute("poster", video.thumbnail);
  },
};

export const QuotedVideo: Story = {
  name: "post-video-s4: 引用された投稿に付いた動画を、引用した投稿の中に表示する",
  tags: ["play"],
  beforeEach: withVideoPosts({
    quote: { authorHandle: "bob.bsky.social", text: "引用された動画", video },
  }),
  play: async ({ canvasElement }) => {
    const el = await player(canvasElement);
    await expect(el.closest("blockquote")).not.toBeNull();
  },
};

const svg = (color: string) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3E%3Crect width='4' height='3' fill='%23${color}'/%3E%3C/svg%3E`;

const viewerPost = (alts: string[]) => ({
  uri: "at://did:plc:alice/app.bsky.feed.post/images",
  cid: "bafyimages",
  authorHandle: "alice.bsky.social",
  authorDisplayName: "Alice",
  text: "画像つきの投稿",
  replyCount: 0,
  repostCount: 0,
  likeCount: 0,
  createdAt: new Date().toISOString(),
  images: alts.map((alt, i) => ({
    thumb: svg(`d9775${i}`),
    fullsize: svg(`d9775${i}`),
    alt,
  })),
});

const withImages =
  (alts: string[]): Story["beforeEach"] =>
  () => {
    queryClient.setQueryData(
      ["timeline"],
      infinite<typeof timelineLoader>({ posts: [viewerPost(alts)] }),
    );
  };

const openViewer = async (canvasElement: HTMLElement, alt: string) => {
  await userEvent.click(
    await within(canvasElement).findByRole("button", { name: alt }),
  );
  return within(await screen.findByRole("dialog", { name: "画像の拡大表示" }));
};

export const ImageViewerOpen: Story = {
  name: "image-viewer-s1: 投稿画像を選ぶと、スレッドは開かずに元サイズの画像を拡大して表示する",
  tags: ["play"],
  beforeEach: withImages(["画像"]),
  play: async ({ canvasElement }) => {
    const viewer = await openViewer(canvasElement, "画像");

    await expect(viewer.getByRole("img")).toHaveAttribute("src", svg("d97750"));
  },
};

export const ImageViewerNavigate: Story = {
  name: "image-viewer-s2: 画像が複数あるときは、前後の画像に切り替えられる",
  tags: ["play"],
  beforeEach: withImages(["画像1", "画像2"]),
  play: async ({ canvasElement }) => {
    const viewer = await openViewer(canvasElement, "画像1");

    await userEvent.click(viewer.getByRole("button", { name: "次の画像" }));
    await waitFor(() =>
      expect(viewer.getByRole("img", { name: "画像2" })).toBeInTheDocument(),
    );
    await userEvent.click(viewer.getByRole("button", { name: "前の画像" }));
    await waitFor(() =>
      expect(viewer.getByRole("img", { name: "画像1" })).toBeInTheDocument(),
    );
  },
};

export const ImageViewerAlt: Story = {
  name: "image-viewer-s3: 拡大した画像の下にALTを表示する",
  tags: ["play"],
  beforeEach: withImages(["ALTの文章"]),
  play: async ({ canvasElement }) => {
    const viewer = await openViewer(canvasElement, "ALTの文章");

    await waitFor(() => expect(viewer.getByText("ALTの文章")).toBeVisible());
  },
};

export const ImageViewerClose: Story = {
  name: "image-viewer-s4: 閉じるボタンかEscキーで閉じる",
  tags: ["play"],
  beforeEach: withImages(["画像"]),
  play: async ({ canvasElement }) => {
    const viewer = await openViewer(canvasElement, "画像");
    const dialog = () =>
      screen.queryByRole("dialog", { name: "画像の拡大表示" });

    await userEvent.click(viewer.getByRole("button", { name: "画像を閉じる" }));
    await waitFor(() => expect(dialog()).toBeNull());
    await openViewer(canvasElement, "画像");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(dialog()).toBeNull());
  },
};

export const ImageViewerSwipe: Story = {
  name: "image-viewer-s5: 画像が複数あるときは、横スワイプで前後の画像に切り替えられる",
  tags: ["play"],
  beforeEach: withImages(["画像1", "画像2"]),
  play: async ({ canvasElement }) => {
    const viewer = await openViewer(canvasElement, "画像1");
    const target = viewer.getByRole("img", { name: "画像1" });
    const swipe = async (dx: number) => {
      const init = {
        pointerId: 1,
        pointerType: "touch",
        isPrimary: true,
        bubbles: true,
      };
      await fireEvent.pointerDown(target, {
        ...init,
        clientX: 300,
        clientY: 200,
        buttons: 1,
      });
      await fireEvent.pointerMove(target, {
        ...init,
        clientX: 300 + dx / 2,
        clientY: 200,
        buttons: 1,
      });
      await fireEvent.pointerMove(target, {
        ...init,
        clientX: 300 + dx,
        clientY: 200,
        buttons: 1,
      });
      await fireEvent.pointerUp(target, {
        ...init,
        clientX: 300 + dx,
        clientY: 200,
      });
    };

    await swipe(-200);
    await waitFor(() =>
      expect(viewer.getByRole("img", { name: "画像2" })).toBeInTheDocument(),
    );
    await swipe(200);
    await waitFor(() =>
      expect(viewer.getByRole("img", { name: "画像1" })).toBeInTheDocument(),
    );
  },
};

export const ImageViewerZoom: Story = {
  name: "image-viewer-s6: 拡大表示した画像は、ピンチ操作か拡大ボタンでさらにズームできる",
  tags: ["play"],
  beforeEach: withImages(["画像"]),
  play: async ({ canvasElement }) => {
    const viewer = await openViewer(canvasElement, "画像");
    const image = viewer.getByRole("img");
    const before = image.getBoundingClientRect().width;

    await userEvent.click(viewer.getByRole("button", { name: "拡大" }));
    await waitFor(() =>
      expect(image.getBoundingClientRect().width).toBeGreaterThan(before),
    );
  },
};
