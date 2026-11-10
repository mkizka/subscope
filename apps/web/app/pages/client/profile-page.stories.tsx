import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import {
  alice,
  type Data,
  infinite,
  queryClient,
} from "@/.storybook/query-client";
import { ListsContainer } from "@/app/features/list/lists-container";
import TimelineFeedStories from "@/app/features/timeline/timeline-feed.stories";
import type { loader as profileLoader } from "@/app/routes/api.profile.$handle";

import { ProfilePage } from "./profile-page";

type ProfileData = Data<typeof profileLoader>;

const seed = (patch: Partial<ProfileData> = {}, tab = "") =>
  queryClient.setQueryData(
    ["profile", alice.handle, tab],
    infinite<typeof profileLoader>({
      profile: {
        ...alice,
        description: "Blueskyを使っています。",
        followsCount: 120,
        followersCount: 345,
      },
      isSelf: false,
      backfillStatus: "completed",
      posts: TimelineFeedStories.args.posts,
      tab: "posts",
      ...patch,
    }),
  );

const pending = (key: string[]) =>
  queryClient
    .query({ queryKey: key, queryFn: () => new Promise<never>(() => {}) })
    .catch(() => {});

const meta = {
  beforeEach: () => {
    seed();
  },
  component: ProfilePage,
  args: {
    handle: "alice.bsky.social",
  },
  parameters: {
    path: "/alice.bsky.social",
    layout: "fullscreen",
  },
} satisfies Meta<typeof ProfilePage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoPosts: Story = {
  beforeEach: () => {
    seed({
      profile: {
        did: alice.did,
        handle: alice.handle,
        displayName: alice.displayName,
        followsCount: 0,
        followersCount: 0,
      },
      posts: [],
    });
  },
};

export const Untracked: Story = {
  beforeEach: () => {
    seed({ backfillStatus: undefined });
  },
};

const main = (canvasElement: HTMLElement) =>
  within(within(canvasElement).getByRole("main"));

export const Self: Story = {
  name: "profile-s1: 自分のプロフィールにはフォローボタンを出さない",
  tags: ["play"],
  beforeEach: () => {
    seed({ isSelf: true });
  },
  play: async ({ canvasElement }) => {
    const page = main(canvasElement);
    await expect(page.getByText(/^345$/)).toBeVisible();
    await expect(page.queryByRole("button", { name: /^フォロー/ })).toBeNull();
  },
};

export const FollowSubmitting: Story = {
  name: "profile-s2: フォローボタンは、押した結果を画面に反映し終えるまで押せない",
  tags: ["play"],
  parameters: { pending: true },
  beforeEach: () => {
    seed({
      profile: {
        ...alice,
        followsCount: 0,
        followersCount: 0,
        viewer: { following: "at://did:plc:alice/app.bsky.graph.follow/1" },
      },
    });
  },
  play: async ({ canvasElement }) => {
    const button = main(canvasElement).getByRole("button", {
      name: "フォロー中",
    });

    await userEvent.click(button);

    await expect(button).toHaveAttribute("aria-disabled", "true");
  },
};

export const SyncStatus: Story = {
  name: "profile-s3: 追跡アカウントの全体ページには、そのアカウントの過去の投稿の同期状態（同期中・同期済み・同期エラー）をハンドルの横に表示する",
  tags: ["play"],
  play: async ({ canvasElement }) => {
    await expect(
      main(canvasElement).getByText("同期済み", { exact: true }),
    ).toBeVisible();
  },
};

export const Loading: Story = {
  name: "profile-s4: プロフィールを開くと、読み込みを待たずに画面を表示し、読み込み終えるまでバナー・アイコン・名前・自己紹介2行と投稿の場所のスケルトンを表示する。ハンドル・タブ・フォロー数は読み込み後に表示する",
  tags: ["play"],
  beforeEach: () => {
    queryClient.removeQueries({ queryKey: ["profile", alice.handle] });
    void pending(["profile", alice.handle, ""]);
  },
  play: async ({ canvasElement }) => {
    const page = main(canvasElement);
    await expect(
      page.getAllByRole("status", { name: "読み込み中" }),
    ).toHaveLength(2);
    await expect(page.queryByText(/^@/)).toBeNull();
    await expect(page.queryByRole("tab", { name: "投稿" })).toBeNull();
    await expect(page.queryByText(/^\d+ フォロー$/)).toBeNull();
  },
};

export const TabLoading: Story = {
  name: "profile-s5: タブを切り替えると、ヘッダーとタブはそのままにして、投稿の場所だけ読み込み終えるまでスケルトンを表示する",
  tags: ["play"],
  beforeEach: () => {
    void pending(["profile", alice.handle, "media"]);
  },
  play: async ({ canvasElement }) => {
    const page = main(canvasElement);

    await userEvent.click(page.getByRole("tab", { name: "メディア" }));

    await expect(
      page.getByRole("status", { name: "読み込み中" }),
    ).toBeVisible();
    await expect(page.getByText("345")).toBeVisible();
    await expect(page.getByRole("tab", { name: "メディア" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  },
};

const ListsTab = () => <ListsContainer handle={alice.handle} />;
const listsRoute = {
  path: "/:handle",
  children: [{ path: "lists", Component: ListsTab }],
};

export const TabLoadingFromLists: Story = {
  name: "profile-s6: 「リスト」タブから他のタブに切り替えても、ヘッダーとタブはそのままにして、投稿の場所だけ読み込み終えるまでスケルトンを表示する",
  tags: ["play"],
  parameters: { path: "/alice.bsky.social/lists", route: listsRoute },
  beforeEach: () => {
    void pending(["lists", alice.handle]);
    void pending(["profile", alice.handle, "media"]);
  },
  play: async ({ canvasElement }) => {
    const page = main(canvasElement);

    await userEvent.click(page.getByRole("tab", { name: "メディア" }));

    await expect(
      page.getByRole("status", { name: "読み込み中" }),
    ).toBeVisible();
    await expect(page.getByText("345")).toBeVisible();
  },
};

export const Links: Story = {
  name: "profile-s7: プロフィールの自己紹介の下に、プロフィールに設定されたリンクを、枠付きの丸いボタンとして折り返しながら並べて表示する。表示名（なければドメイン）を選ぶと、リンク先を新しいタブで開く",
  tags: ["play"],
  beforeEach: () => {
    seed({
      profile: {
        ...alice,
        followsCount: 0,
        followersCount: 0,
        links: [
          {
            uri: "at://a/app.bsky.actor.link/1",
            cid: "a",
            url: "https://example.com/blog",
            title: "ブログ",
          },
          {
            uri: "at://a/app.bsky.actor.link/2",
            cid: "b",
            url: "https://example.org/",
          },
        ],
      },
    });
  },
  play: async ({ canvasElement }) => {
    const page = main(canvasElement);
    await expect(page.getByRole("link", { name: "ブログ" })).toHaveAttribute(
      "href",
      "https://example.com/blog",
    );
    await expect(
      page.getByRole("link", { name: "example.org" }),
    ).toHaveAttribute("target", "_blank");
  },
};

export const AvatarFallback: Story = {
  name: "profile-s8: アイコン画像を設定していないアカウントには、人型のシルエットをアイコンの代わりに表示する",
  tags: ["play"],
  play: async ({ canvasElement }) => {
    await expect(
      main(canvasElement)
        .getByRole("button", { name: "アイコンを拡大" })
        .querySelector('[data-testid="avatar-fallback"]'),
    ).toBeVisible();
  },
};

export const FollowedBy: Story = {
  name: "profile-s9: 自分をフォローしているアカウントのプロフィール全体ページには、ハンドルの横に「フォローされています」を表示する",
  tags: ["play"],
  beforeEach: () => {
    seed({
      profile: {
        ...alice,
        followsCount: 0,
        followersCount: 0,
        viewer: { followedBy: "at://did:plc:alice/app.bsky.graph.follow/1" },
      },
    });
  },
  play: async ({ canvasElement }) => {
    await expect(
      main(canvasElement).getByText("フォローされています"),
    ).toBeVisible();
  },
};

export const UntrackedBadge: Story = {
  name: "profile-s10: 追跡アカウントでない全体ページには、ハンドルの横に「同期対象外」を表示する",
  tags: ["play"],
  beforeEach: () => {
    seed({ backfillStatus: undefined });
  },
  play: async ({ canvasElement }) => {
    await expect(
      main(canvasElement).getByText("同期対象外", { exact: true }),
    ).toBeVisible();
  },
};

export const UntrackedNotice: Story = {
  name: "profile-s11: 追跡アカウントでない全体ページには、タブの下に「このアカウントのデータはサーバーに同期されていません。フォローすると同期を開始します。」を全てのタブで表示する",
  tags: ["play"],
  beforeEach: () => {
    seed({ backfillStatus: undefined });
    seed({ backfillStatus: undefined, tab: "likes" }, "likes");
  },
  play: async ({ canvasElement }) => {
    const page = main(canvasElement);
    const notice = page.getByText(
      "このアカウントのデータはサーバーに同期されていません。フォローすると同期を開始します。",
    );
    await expect(notice).toBeVisible();

    await userEvent.click(page.getByRole("tab", { name: "いいね" }));

    await expect(notice).toBeVisible();
  },
};

export const ListsLoading: Story = {
  name: "list-s5: リスト一覧を開くと、リストの読み込みを待たずに画面を表示し、読み込み終えるまでスケルトンを表示する",
  tags: ["play"],
  parameters: {
    path: "/alice.bsky.social/lists",
    route: listsRoute,
  },
  beforeEach: () => {
    void pending(["lists", alice.handle]);
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tab", { name: "リスト" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      canvas.getByRole("status", { name: "読み込み中" }),
    ).toBeVisible();
  },
};
