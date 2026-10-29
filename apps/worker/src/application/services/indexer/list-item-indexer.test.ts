import { actorFactory, recordFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { afterCommit, testRegistry } from "../../../shared/test-utils.js";

describe("ListItemIndexer", () => {
  test("リスト項目レコードを保存し、対象アクターを作成する", async () => {
    // arrange
    const { listItemIndexer, listItemRepository, actorRepository, db } =
      await testRegistry.resolve();
    const actor = actorFactory();
    const subject = actorFactory();
    const listUri = `at://${actor.did}/app.bsky.graph.list/listrkey123`;
    const record = recordFactory({
      uri: `at://${actor.did}/app.bsky.graph.listitem/itemrkey123`,
      json: {
        $type: "app.bsky.graph.listitem",
        list: listUri,
        subject: subject.did,
        createdAt: new Date().toISOString(),
      },
    });

    // act
    await listItemIndexer.upsert({
      ctx: { db, afterCommit },
      record,
      live: false,
    });

    // assert
    expect(listItemRepository.findByUri(record.uri)).toMatchObject({
      actorDid: actor.did,
      subjectDid: subject.did,
    });
    expect(listItemRepository.findByUri(record.uri)?.listUri.toString()).toBe(
      listUri,
    );
    expect(
      await actorRepository.findByDid({ ctx: { db }, did: subject.did }),
    ).not.toBeNull();
  });
});
