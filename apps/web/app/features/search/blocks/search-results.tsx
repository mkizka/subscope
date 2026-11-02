import {
  type Account,
  AccountList,
} from "@/app/features/profile/blocks/account-list";
import {
  TimelineFeed,
  type TimelinePost,
} from "@/app/features/timeline/blocks/timeline-feed";

type Props = {
  tab: "accounts" | "posts";
  accounts: Account[];
  posts: TimelinePost[];
};

const NotFound = ({ children }: { children: string }) => (
  <p className="py-8 text-center text-label text-muted">{children}</p>
);

export function SearchResults({ tab, accounts, posts }: Props) {
  if (tab === "accounts") {
    return accounts.length > 0 ? (
      <AccountList accounts={accounts} />
    ) : (
      <NotFound>ユーザーが見つかりません</NotFound>
    );
  }
  return posts.length > 0 ? (
    // ponytail: 返信・引用は投稿欄のあるタイムラインでだけ動く。全体ページに投稿欄を置くときにつなぐ
    <TimelineFeed posts={posts} />
  ) : (
    <NotFound>投稿が見つかりません</NotFound>
  );
}
