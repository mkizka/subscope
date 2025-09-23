ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_uri_records_uri_fk";
--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_pkey";
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD PRIMARY KEY ("actor_did");--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "uri";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "cid";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "appview_did";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "indexed_at";