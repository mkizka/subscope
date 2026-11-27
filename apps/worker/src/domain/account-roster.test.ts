import { asDid } from "@atproto/did";
import { describe, expect, test } from "vitest";

import { AccountKind } from "./account-kind.js";
import { AccountRoster, type StreamEvent } from "./account-roster.js";

const member = asDid("did:plc:member");
const tracked = asDid("did:plc:tracked");
const other = asDid("did:plc:other");

const commit = (
  authorDid: StreamEvent["authorDid"],
  overrides: Partial<Extract<StreamEvent, { kind: "commit" }>> = {},
): StreamEvent => ({
  kind: "commit",
  authorDid,
  operation: "create",
  collection: "app.bsky.feed.post",
  mentionedDids: [],
  ...overrides,
});

describe("AccountRoster", () => {
  const roster = new AccountRoster();
  roster.replace({ memberDids: [member], trackedDids: [tracked] });

  test.each([
    { name: "メンバーが書いた", event: commit(member), expected: false },
    {
      name: "追跡アカウントがいいね以外を書いた",
      event: commit(tracked),
      expected: true,
    },
    {
      name: "追跡アカウントがメンバー以外にいいねした",
      event: commit(tracked, { collection: "app.bsky.feed.like" }),
      expected: false,
    },
    {
      name: "その他のアカウントがメンバーに返信した",
      event: commit(other, { mentionedDids: [member] }),
      expected: true,
    },
    {
      name: "その他のアカウントのプロフィールにメンバーのDIDが含まれる",
      event: commit(other, {
        collection: "app.bsky.actor.profile",
        mentionedDids: [member],
      }),
      expected: false,
    },
    {
      name: "その他のアカウントがメンバー以外に返信した",
      event: commit(other, { mentionedDids: [tracked] }),
      expected: false,
    },
    {
      name: "その他のアカウントが返信制限を書いた",
      event: commit(other, { collection: "app.bsky.feed.threadgate" }),
      expected: true,
    },
    {
      name: "その他のアカウントが削除した",
      event: commit(other, { operation: "delete" }),
      expected: true,
    },
    {
      name: "追跡アカウントのハンドルが変わった",
      event: { kind: "identity", authorDid: tracked },
      expected: true,
    },
    {
      name: "その他のアカウントのハンドルが変わった",
      event: { kind: "identity", authorDid: other },
      expected: false,
    },
  ] satisfies { name: string; event: StreamEvent; expected: boolean }[])(
    "$name場合、passesは$expectedを返す",
    ({ event, expected }) => {
      // act
      const result = roster.passes(event);

      // assert
      expect(result).toBe(expected);
    },
  );

  test("setで区分を変えた場合、変えた後の区分で判定する", () => {
    // arrange
    const roster = new AccountRoster();
    roster.replace({ memberDids: [], trackedDids: [tracked] });

    // act
    roster.set(tracked, AccountKind.member());

    // assert
    expect(roster.passes(commit(tracked))).toBe(false);
    expect(roster.passes(commit(other, { mentionedDids: [tracked] }))).toBe(
      true,
    );
  });

  test("setでその他にした場合、どちらの集合からも消す", () => {
    // arrange
    const roster = new AccountRoster();
    roster.replace({ memberDids: [member], trackedDids: [tracked] });

    // act
    roster.set(member, AccountKind.other());
    roster.set(tracked, AccountKind.other());

    // assert
    expect(roster.passes(commit(member, { operation: "delete" }))).toBe(true);
    expect(roster.passes(commit(other, { mentionedDids: [member] }))).toBe(
      false,
    );
    expect(roster.passes(commit(tracked))).toBe(false);
  });
});
