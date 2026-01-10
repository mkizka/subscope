import { Badge } from "../../../components/badge";
import { Button } from "../../../components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/card";
import { CheckIcon, CopyIcon, KeyIcon } from "../../../components/icons";

export type InviteCode = {
  id: string;
  code: string;
  createdAt: string;
  usedBy: string | null;
  status: "未使用" | "使用済み";
};

type InviteCodesPresenterProps = {
  inviteCodes: InviteCode[];
  copiedCode: string | null;
  onGenerateInviteCode: () => void;
  onCopyToClipboard: (code: string) => void;
};

function InviteCodeItem({
  invite,
  copiedCode,
  onCopyToClipboard,
}: {
  invite: InviteCode;
  copiedCode: string | null;
  onCopyToClipboard: (code: string) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border border-outline-variant rounded-medium hover:bg-surface-container-highest transition-all duration-200">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <code className="text-sm font-mono font-semibold text-on-surface">
            {invite.code}
          </code>
          <Badge variant={invite.status === "未使用" ? "default" : "secondary"}>
            {invite.status}
          </Badge>
        </div>
        <p className="text-xs text-on-surface-variant">
          発行日: {invite.createdAt}
          {invite.usedBy && ` | 使用者: ${invite.usedBy}`}
        </p>
      </div>
      {invite.status === "未使用" && (
        <Button
          variant="ghost"
          className="ml-4"
          onClick={() => onCopyToClipboard(invite.code)}
        >
          {copiedCode === invite.code ? (
            <CheckIcon className="h-4 w-4 text-primary" />
          ) : (
            <CopyIcon className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}

export function InviteCodesPresenter({
  inviteCodes,
  copiedCode,
  onGenerateInviteCode,
  onCopyToClipboard,
}: InviteCodesPresenterProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>新規招待コード発行</CardTitle>
          <CardDescription>
            新しい招待コードを生成してユーザーを招待
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onGenerateInviteCode} className="w-full sm:w-auto">
            <KeyIcon className="h-4 w-4 mr-2" />
            招待コードを発行
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>招待コード一覧</CardTitle>
          <CardDescription>発行された招待コードの管理</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {inviteCodes.map((invite) => (
              <InviteCodeItem
                key={invite.id}
                invite={invite}
                copiedCode={copiedCode}
                onCopyToClipboard={onCopyToClipboard}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
