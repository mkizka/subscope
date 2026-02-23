import { AppLayout } from "@/app/components/layout";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { HomeContent } from "@/app/features/home/parts/home-content";
import { SetupContent } from "@/app/features/home/parts/setup-content";

type Props = {
  variant: "home" | "setup";
};

export function HomePage({ variant }: Props) {
  return (
    <AppLayout verticalCenter>
      <div className="flex w-full flex-col gap-6 py-8 [word-break:auto-phrase]">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Subscope</h1>
            <Badge variant="secondary">Alpha</Badge>
          </div>
          <p className="text-muted-foreground">
            誰でもセルフホストできるBluesky互換Appview
          </p>
        </div>
        <Separator />
        {variant === "setup" ? <SetupContent /> : <HomeContent />}
      </div>
    </AppLayout>
  );
}
