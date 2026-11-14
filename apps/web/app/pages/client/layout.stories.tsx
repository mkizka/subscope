import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { alice, infinite, queryClient } from "@/.storybook/query-client";
import TimelineFeedStories from "@/app/features/timeline/timeline-feed.stories";
import type { loader as timelineLoader } from "@/app/routes/api.timeline";

import { TimelinePage } from "./timeline-page";

const meta = {
  title: "pages/client/Layout",
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

const desktop = { viewport: { value: "desktop" } };
const mobile = { viewport: { value: "mobile1" } };

const sideNav = (canvasElement: HTMLElement) =>
  within(within(canvasElement).getByRole("navigation"));

const tabBar = (canvasElement: HTMLElement) =>
  within(within(canvasElement).getByRole("navigation", { name: "タブバー" }));

const rightColumn = (canvasElement: HTMLElement) => {
  const aside = within(canvasElement).getAllByRole("complementary").at(-1);
  if (!aside) throw new Error("右カラムがありません");
  return within(aside);
};

export const SideNavCurrent: Story = {
  name: "layout-s1: 左カラムのメニューで、今いるページの項目を強調する",
  globals: desktop,
  play: async ({ canvasElement }) => {
    const nav = sideNav(canvasElement);

    await expect(nav.getByRole("link", { name: "ホーム" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "通知" })).not.toHaveAttribute(
      "aria-current",
    );
  },
};

export const SideNavHandle: Story = {
  name: "layout-s2: 左カラムのアカウント欄に、自分のハンドルを表示する",
  globals: desktop,
  play: async ({ canvasElement }) => {
    await expect(
      sideNav(canvasElement).getByText(`@${alice.handle}`),
    ).toBeVisible();
  },
};

export const ServerCard: Story = {
  name: "layout-s3: 右カラムに、見出し「サーバーについて」と「SubscopeはBlueskyでフォローしている人の投稿だけが流れる分散SNSです。」を出したカードを表示し、カード全体を `/server` へのリンクにする",
  globals: desktop,
  play: async ({ canvasElement }) => {
    const card = rightColumn(canvasElement).getByRole("link", {
      name: /サーバーについて/,
    });

    await expect(card).toHaveTextContent(
      "SubscopeはBlueskyでフォローしている人の投稿だけが流れる分散SNSです。",
    );
    await expect(card).toHaveAttribute("href", "/server");
  },
};

export const TabBarCurrent: Story = {
  name: "layout-s4: モバイルでは下のタブで今いるページの項目を強調する",
  globals: mobile,
  play: async ({ canvasElement }) => {
    const tabs = tabBar(canvasElement);

    await expect(tabs.getByRole("link", { name: "ホーム" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(tabs.getByRole("link", { name: "検索" })).not.toHaveAttribute(
      "aria-current",
    );
  },
};

const openDrawer = async (canvasElement: HTMLElement) => {
  await userEvent.click(
    within(canvasElement).getByRole("button", { name: "メニューを開く" }),
  );
  return within(
    within(canvasElement).getByRole("dialog", { name: "メニュー" }),
  );
};

export const DrawerItems: Story = {
  name: "layout-s5: モバイルのドロワーにはPCの左カラムと同じメニュー項目を並べる",
  globals: mobile,
  play: async ({ canvasElement }) => {
    const pcItems = [...canvasElement.querySelectorAll("aside nav a")].map(
      (a) => a.textContent,
    );

    const drawer = await openDrawer(canvasElement);

    await expect(drawer.getAllByRole("link").map((a) => a.textContent)).toEqual(
      pcItems,
    );
  },
};

export const ServerMenu: Story = {
  name: "layout-s6: 左カラムとモバイルのドロワーのメニューの「サーバー」から `/server` に移動できる",
  globals: mobile,
  play: async ({ canvasElement }) => {
    const drawer = await openDrawer(canvasElement);

    await expect(
      drawer.getByRole("link", { name: "サーバー" }),
    ).toHaveAttribute("href", "/server");
    await expect(
      canvasElement.querySelector('aside nav a[href="/server"]'),
    ).not.toBeNull();
  },
};

export const SettingsMenu: Story = {
  name: "layout-s15: 左カラムとモバイルのドロワーのメニューの「設定」から `/settings` に移動できる",
  globals: mobile,
  play: async ({ canvasElement }) => {
    const drawer = await openDrawer(canvasElement);

    await expect(drawer.getByRole("link", { name: "設定" })).toHaveAttribute(
      "href",
      "/settings",
    );
    await expect(
      canvasElement.querySelector('aside nav a[href="/settings"]'),
    ).not.toBeNull();
  },
};

export const Skeleton: Story = {
  name: "layout-s12: スケルトンは、左から右へ光が流れるアニメーションで読み込み中であることを示す",
  beforeEach: () => {
    queryClient.removeQueries({ queryKey: ["timeline"] });
    queryClient
      .query({
        queryKey: ["timeline"],
        queryFn: () => new Promise<never>(() => {}),
      })
      .catch(() => {});
  },
  play: async ({ canvasElement }) => {
    const skeleton = within(canvasElement)
      .getByRole("status", { name: "読み込み中" })
      .querySelector(".skeleton");

    await expect(skeleton).not.toBeNull();
    await expect(skeleton && getComputedStyle(skeleton).animationName).toBe(
      "skeleton-shimmer",
    );
  },
};

export const TabBarIconOnly: Story = {
  name: "layout-s13: モバイルでは下のタブにラベル文字を出さず、アイコンだけを表示する",
  globals: mobile,
  play: async ({ canvasElement }) => {
    const tabs = tabBar(canvasElement);

    await expect(tabs.getByRole("link", { name: "ホーム" })).toBeVisible();
    await expect(tabs.queryByText("ホーム")).toBeNull();
    await expect(tabs.queryByText("プロフィール")).toBeNull();
  },
};

export const StackingOrder: Story = {
  name: "layout-s14: 重なり順は下から、本文・埋め込み、浮かせた表示、固定の見出し、固定の下タブ、検索候補の順にする",
  globals: mobile,
  play: async ({ canvasElement }) => {
    const z = (el: Element) => Number(getComputedStyle(el).zIndex);
    const tabsEl = within(canvasElement).getByRole("navigation", {
      name: "タブバー",
    });
    const header = z(within(canvasElement).getByRole("banner"));
    const tabs = z(tabsEl);

    await expect(header).toBeGreaterThan(0);
    await expect(tabs).toBeGreaterThan(header);
  },
};

export const TabsPinnedOnScroll: Story = {
  name: "layout-s10: モバイルでは、タブのあるページ（タイムライン・プロフィール・サーバーなど）は、ヘッダーを隠すとタブだけを画面上端に残し、ヘッダーの再表示と同時にタブをその下へ戻す",
  globals: mobile,
  play: async ({ canvasElement }) => {
    const main = canvasElement.querySelector("main");
    main?.style.setProperty("min-height", "3000px");
    const tab = within(canvasElement).getByRole("tab", { name: "フォロー中" });
    const menu = within(canvasElement).getByRole("button", {
      name: "メニューを開く",
    });
    window.scrollTo(0, 1000);
    await waitFor(() =>
      expect(menu.closest("header")?.dataset.visible).toBe("false"),
    );
    await waitFor(() => expect(tab.getBoundingClientRect().y).toBeLessThan(56));
    await expect(tab.getBoundingClientRect().bottom).toBeGreaterThan(0);
    window.scrollTo(0, 900);
    await waitFor(() =>
      expect(tab.getBoundingClientRect().y).toBeGreaterThanOrEqual(56),
    );
  },
};
