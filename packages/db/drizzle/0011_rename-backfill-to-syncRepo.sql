ALTER TABLE "actors" RENAME COLUMN "backfill_status" TO "sync_repo_status";--> statement-breakpoint
ALTER TABLE "actors" RENAME COLUMN "backfill_version" TO "sync_repo_version";