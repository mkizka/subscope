ALTER TABLE "actor_stats" RENAME TO "account_stats";--> statement-breakpoint
ALTER TABLE "actors" RENAME TO "accounts";--> statement-breakpoint
ALTER TABLE "account_stats" RENAME COLUMN "actor_did" TO "account_did";--> statement-breakpoint
ALTER TABLE "feed_items" RENAME COLUMN "actor_did" TO "account_did";--> statement-breakpoint
ALTER TABLE "follows" RENAME COLUMN "actor_did" TO "account_did";--> statement-breakpoint
ALTER TABLE "generators" RENAME COLUMN "actor_did" TO "account_did";--> statement-breakpoint
ALTER TABLE "labels" RENAME COLUMN "actor_did" TO "account_did";--> statement-breakpoint
ALTER TABLE "likes" RENAME COLUMN "actor_did" TO "account_did";--> statement-breakpoint
ALTER TABLE "list_items" RENAME COLUMN "actor_did" TO "account_did";--> statement-breakpoint
ALTER TABLE "lists" RENAME COLUMN "actor_did" TO "account_did";--> statement-breakpoint
ALTER TABLE "posts" RENAME COLUMN "actor_did" TO "account_did";--> statement-breakpoint
ALTER TABLE "profiles" RENAME COLUMN "actor_did" TO "account_did";--> statement-breakpoint
ALTER TABLE "records" RENAME COLUMN "actor_did" TO "account_did";--> statement-breakpoint
ALTER TABLE "reposts" RENAME COLUMN "actor_did" TO "account_did";--> statement-breakpoint
ALTER TABLE "registrations" RENAME COLUMN "actor_did" TO "account_did";--> statement-breakpoint
ALTER TABLE "account_stats" RENAME CONSTRAINT "actor_stats_pkey" TO "account_stats_pkey";--> statement-breakpoint
ALTER TABLE "account_stats" RENAME CONSTRAINT "actor_stats_actor_did_actors_did_fk" TO "account_stats_account_did_accounts_did_fk";--> statement-breakpoint
ALTER TABLE "accounts" RENAME CONSTRAINT "actors_pkey" TO "accounts_pkey";--> statement-breakpoint
ALTER TABLE "feed_items" RENAME CONSTRAINT "feed_items_actor_did_actors_did_fk" TO "feed_items_account_did_accounts_did_fk";--> statement-breakpoint
ALTER TABLE "follows" RENAME CONSTRAINT "follows_actor_did_actors_did_fk" TO "follows_account_did_accounts_did_fk";--> statement-breakpoint
ALTER TABLE "follows" RENAME CONSTRAINT "follows_subject_did_actors_did_fk" TO "follows_subject_did_accounts_did_fk";--> statement-breakpoint
ALTER TABLE "generators" RENAME CONSTRAINT "generators_actor_did_actors_did_fk" TO "generators_account_did_accounts_did_fk";--> statement-breakpoint
ALTER TABLE "labels" RENAME CONSTRAINT "labels_actor_did_actors_did_fk" TO "labels_account_did_accounts_did_fk";--> statement-breakpoint
ALTER TABLE "likes" RENAME CONSTRAINT "likes_actor_did_actors_did_fk" TO "likes_account_did_accounts_did_fk";--> statement-breakpoint
ALTER TABLE "list_items" RENAME CONSTRAINT "list_items_actor_did_actors_did_fk" TO "list_items_account_did_accounts_did_fk";--> statement-breakpoint
ALTER TABLE "list_items" RENAME CONSTRAINT "list_items_subject_did_actors_did_fk" TO "list_items_subject_did_accounts_did_fk";--> statement-breakpoint
ALTER TABLE "lists" RENAME CONSTRAINT "lists_actor_did_actors_did_fk" TO "lists_account_did_accounts_did_fk";--> statement-breakpoint
ALTER TABLE "notifications" RENAME CONSTRAINT "notifications_recipient_did_actors_did_fk" TO "notifications_recipient_did_accounts_did_fk";--> statement-breakpoint
ALTER TABLE "notifications" RENAME CONSTRAINT "notifications_author_did_actors_did_fk" TO "notifications_author_did_accounts_did_fk";--> statement-breakpoint
ALTER TABLE "posts" RENAME CONSTRAINT "posts_actor_did_actors_did_fk" TO "posts_account_did_accounts_did_fk";--> statement-breakpoint
ALTER TABLE "profiles" RENAME CONSTRAINT "profiles_actor_did_actors_did_fk" TO "profiles_account_did_accounts_did_fk";--> statement-breakpoint
ALTER TABLE "records" RENAME CONSTRAINT "records_actor_did_actors_did_fk" TO "records_account_did_accounts_did_fk";--> statement-breakpoint
ALTER TABLE "reposts" RENAME CONSTRAINT "reposts_actor_did_actors_did_fk" TO "reposts_account_did_accounts_did_fk";--> statement-breakpoint
ALTER TABLE "registrations" RENAME CONSTRAINT "registrations_actor_did_actors_did_fk" TO "registrations_account_did_accounts_did_fk";--> statement-breakpoint
ALTER INDEX "feed_items_actor_sort_idx" RENAME TO "feed_items_account_sort_idx";--> statement-breakpoint
ALTER INDEX "follows_actor_subject_idx" RENAME TO "follows_account_subject_idx";--> statement-breakpoint
ALTER INDEX "follows_subject_actor_idx" RENAME TO "follows_subject_account_idx";--> statement-breakpoint
ALTER INDEX "likes_actor_sort_idx" RENAME TO "likes_account_sort_idx";--> statement-breakpoint
ALTER INDEX "posts_actor_did_idx" RENAME TO "posts_account_did_idx";--> statement-breakpoint
ALTER INDEX "profiles_actor_idx" RENAME TO "profiles_account_idx";
