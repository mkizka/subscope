ALTER TABLE "subscriptions" RENAME TO "registrations";--> statement-breakpoint
ALTER TABLE "registrations" RENAME CONSTRAINT "subscriptions_pkey" TO "registrations_pkey";--> statement-breakpoint
ALTER TABLE "registrations" RENAME CONSTRAINT "subscriptions_actor_did_actors_did_fk" TO "registrations_actor_did_actors_did_fk";--> statement-breakpoint
ALTER TABLE "registrations" RENAME CONSTRAINT "subscriptions_invite_code_invite_codes_code_fk" TO "registrations_invite_code_invite_codes_code_fk";
