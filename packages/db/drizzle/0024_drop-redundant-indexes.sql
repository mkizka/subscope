DROP INDEX "feed_items_actor_did_idx";--> statement-breakpoint
DROP INDEX "follows_sort_at_idx";--> statement-breakpoint
DROP INDEX "follows_actor_did_idx";--> statement-breakpoint
DROP INDEX "follows_subject_did_idx";--> statement-breakpoint
DROP INDEX "likes_sort_at_idx";--> statement-breakpoint
DROP INDEX "likes_subject_uri_idx";--> statement-breakpoint
DROP INDEX "posts_reply_parent_uri_idx";--> statement-breakpoint
DROP INDEX "reposts_sort_at_idx";--> statement-breakpoint
DROP INDEX "reposts_subject_uri_idx";--> statement-breakpoint
CREATE INDEX "likes_actor_sort_idx" ON "likes" USING btree ("actor_did","sort_at" DESC NULLS LAST);