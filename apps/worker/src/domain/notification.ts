export type Notification = {
  recordUri: string;
  recipientDid: string;
  authorDid: string;
  reason: "like" | "repost" | "follow" | "mention" | "reply" | "quote";
  reasonSubject: string | null;
  sortAt: Date;
};

export function selectDeliverable(
  candidates: Notification[],
  memberDids: ReadonlySet<string>,
): Notification[] {
  const byRecipient = new Map<string, Notification>();
  for (const candidate of candidates) {
    const { recipientDid, authorDid } = candidate;
    if (
      recipientDid !== authorDid &&
      memberDids.has(recipientDid) &&
      !byRecipient.has(recipientDid)
    ) {
      byRecipient.set(recipientDid, candidate);
    }
  }
  return [...byRecipient.values()];
}
