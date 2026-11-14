import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";

import {
  alice,
  bob,
  type Data,
  infinite,
  queryClient,
} from "@/.storybook/query-client";
import { ListsContainer } from "@/app/features/list/lists-container";
import TimelineFeedStories from "@/app/features/timeline/timeline-feed.stories";
import type { loader as membershipLoader } from "@/app/routes/api.list-membership.$did";
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
  name: "profile-s2: フォローボタンは押した結果を画面に反映し終えるまで押せない",
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
  name: "profile-s3: 追跡アカウントの全体ページにはそのアカウントの過去の投稿の同期状態（同期中・同期済み・同期エラー）をハンドルの横に表示する",
  play: async ({ canvasElement }) => {
    await expect(
      main(canvasElement).getByText("同期済み", { exact: true }),
    ).toBeVisible();
  },
};

export const Loading: Story = {
  name: "profile-s4: プロフィールを開くと、読み込みを待たずに画面を表示し、読み込み終えるまでバナー・アイコン・名前・自己紹介2行と投稿の場所のスケルトンを表示する。ハンドル・タブ・フォロー数は読み込み後に表示する",
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

const knownFollowers = {
  count: 14,
  followers: [
    { ...bob },
    { did: "did:plc:carol", handle: "carol.bsky.social" } as const,
    {
      did: "did:plc:dave",
      handle: "dave.bsky.social",
      displayName: "Dave",
    } as const,
  ],
};

export const KnownFollowers: Story = {
  name: "profile-s12: 自分がフォローしているアカウントのうちそのアカウントをフォローしている人（知り合い）がいる全体ページには、フォロー数の下に知り合いのアイコン（最大3人）と名前（最大2人）、残りの人数を「Bob、Carolほか12人がフォローしています」の形で表示し、選ぶとフォロワー一覧の「知り合い」タブに移動する",
  beforeEach: () => {
    seed({
      profile: {
        ...alice,
        followsCount: 120,
        followersCount: 345,
        viewer: { knownFollowers },
      },
    });
  },
  play: async ({ canvasElement }) => {
    const link = main(canvasElement).getByRole("link", {
      name: "Bob、carol.bsky.socialほか12人がフォローしています",
    });
    await expect(link).toHaveAttribute(
      "href",
      "/alice.bsky.social/followers?filter=known",
    );
  },
};

export const NoKnownFollowers: Story = {
  name: "profile-s13: 知り合いがいない全体ページと自分の全体ページには、知り合いの行を表示しない",
  play: async ({ canvasElement }) => {
    await expect(main(canvasElement).getByText("345")).toBeVisible();
    await expect(
      main(canvasElement).queryByText(/がフォローしています/),
    ).toBeNull();
  },
};

export const KnownFollowersView: Story = {
  beforeEach: KnownFollowers.beforeEach,
};

export const UntrackedBadge: Story = {
  name: "profile-s10: 追跡アカウントでない全体ページには、ハンドルの横に「同期対象外」を表示する",
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

const svg = (color: string): `data:${string}` =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3E%3Crect width='4' height='3' fill='%23${color}'/%3E%3C/svg%3E`;

export const ImageViewerProfile: Story = {
  name: "imageViewer-s7: プロフィール全体ページのアイコンかバナーを選ぶと、その画像を拡大して表示する",
  beforeEach: () => {
    queryClient.setQueryData(
      ["profile", alice.handle, ""],
      infinite<typeof profileLoader>({
        profile: {
          ...alice,
          avatar: svg("d97750"),
          banner: svg("d97751"),
          followsCount: 0,
          followersCount: 0,
        },
        isSelf: false,
        backfillStatus: "completed",
        posts: [],
        tab: "posts",
      }),
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = () =>
      screen.queryByRole("dialog", { name: "画像の拡大表示" });
    const viewerSrc = () => dialog()?.querySelector("img")?.getAttribute("src");

    await userEvent.click(
      await canvas.findByRole("button", { name: "アイコンを拡大" }),
    );
    await waitFor(() => expect(viewerSrc()).toBe(svg("d97750")));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(dialog()).toBeNull());
    await userEvent.click(canvas.getByRole("button", { name: "バナーを拡大" }));
    await waitFor(() => expect(viewerSrc()).toBe(svg("d97751")));
  },
};

export const ListsLoading: Story = {
  name: "list-s5: リスト一覧を開くと、リストの読み込みを待たずに画面を表示し、読み込み終えるまでスケルトンを表示する",
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

export const TabsStayInPlaceOnSlowScroll: Story = {
  name: "layout-s16: モバイルでタブがまだ画面上端に届いていないうちにヘッダーが隠れても、タブはその場から動かさず、下の投稿との間に隙間を作らない",
  globals: { viewport: { value: "mobile1" } },
  play: async ({ canvasElement }) => {
    canvasElement
      .querySelector("main")
      ?.style.setProperty("min-height", "3000px");
    const tablist = within(canvasElement).getByRole("tablist");
    const header = canvasElement.querySelector("header");
    const firstPost = tablist.nextElementSibling;
    window.scrollTo(0, 100);
    await waitFor(() => expect(header?.dataset.visible).toBe("false"));
    await expect(tablist.getBoundingClientRect().top).toBeGreaterThan(56);
    await new Promise((resolve) => setTimeout(resolve, 400));
    await expect(firstPost?.getBoundingClientRect().top).toBeCloseTo(
      tablist.getBoundingClientRect().bottom,
      0,
    );
  },
};

const seedMembership = (lists: Data<typeof membershipLoader>["lists"]) =>
  queryClient.setQueryData(["listMembership", alice.did], { lists });

const openAddToList = async (canvasElement: HTMLElement) => {
  await userEvent.click(
    main(canvasElement).getByRole("button", { name: "その他" }),
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "リストに追加" }),
  );
  return within(await screen.findByRole("dialog", { name: "リストに追加" }));
};

const membershipLists: Data<typeof membershipLoader>["lists"] = [
  {
    uri: "at://did:plc:me/app.bsky.graph.list/1",
    rkey: "1",
    creatorDid: "did:plc:me",
    name: "技術系",
    description: "Webとプロトコルの話をする人",
    listItemUri: "at://did:plc:me/app.bsky.graph.listitem/1",
  },
  {
    uri: "at://did:plc:me/app.bsky.graph.list/2",
    rkey: "2",
    creatorDid: "did:plc:me",
    name: "友だち",
  },
];

export const AddToListDialog: Story = {
  name: "list-s8: 「リストに追加」ダイアログは、自分のキュレーションリストを新しい順に並べ、そのアカウントが入っているリストに「削除」、入っていないリストに「追加」を出す",
  beforeEach: () => {
    seedMembership(membershipLists);
  },
  play: async ({ canvasElement }) => {
    const dialog = await openAddToList(canvasElement);

    await expect(dialog.getByText("技術系")).toBeVisible();
    await expect(dialog.getByText("友だち")).toBeVisible();
    await expect(
      dialog.getAllByRole("button").map((button) => button.textContent),
    ).toEqual(["削除", "追加", "完了"]);
  },
};

export const AddToListSubmitting: Story = {
  name: "list-s9: 「リストに追加」ダイアログの追加・削除ボタンは、送信が終わるまでスピナーを出して押せなくする",
  parameters: { pending: true },
  beforeEach: () => {
    seedMembership(membershipLists);
  },
  play: async ({ canvasElement }) => {
    const dialog = await openAddToList(canvasElement);

    await userEvent.click(dialog.getByRole("button", { name: "追加" }));

    await expect(dialog.getByRole("button", { name: "追加" })).toBeDisabled();
  },
};

export const AddToListLoading: Story = {
  name: "list-s10: 「リストに追加」ダイアログは、開いてから読み込み終えるまでスケルトンを表示し、自分のリストが無いときは「リストがありません。」とリスト管理画面（`/lists`）へのリンクを表示する",
  beforeEach: () => {
    void pending(["listMembership", alice.did]);
  },
  play: async ({ canvasElement }) => {
    const dialog = await openAddToList(canvasElement);
    await expect(
      dialog.getByRole("status", { name: "読み込み中" }),
    ).toBeVisible();

    queryClient.setQueryData(["listMembership", alice.did], { lists: [] });

    await expect(
      await dialog.findByRole("link", { name: "リストを作成" }),
    ).toHaveAttribute("href", "/lists");
  },
};
