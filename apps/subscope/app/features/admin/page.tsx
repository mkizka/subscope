import { InviteCodeTable } from "./block/invite-code-table";

type InviteCode = {
  code: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
  usedBy?: { did: string; handle?: string };
};

type Props = {
  codes: InviteCode[];
  nextCursor?: string;
};

export function AdminPage({ codes, nextCursor }: Props) {
  return (
    <div className="size-full flex justify-center">
      <div className="w-full max-w-4xl p-4">
        <InviteCodeTable codes={codes} nextCursor={nextCursor} />
      </div>
    </div>
  );
}
