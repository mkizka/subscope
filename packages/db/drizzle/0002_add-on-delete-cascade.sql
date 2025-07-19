ALTER TABLE "feed_items" DROP CONSTRAINT "feed_items_actor_did_actors_did_fk";
--> statement-breakpoint
ALTER TABLE "follows" DROP CONSTRAINT "follows_actor_did_actors_did_fk";
--> statement-breakpoint
ALTER TABLE "follows" DROP CONSTRAINT "follows_subject_did_actors_did_fk";
--> statement-breakpoint
ALTER TABLE "generators" DROP CONSTRAINT "generators_actor_did_actors_did_fk";
--> statement-breakpoint
ALTER TABLE "likes" DROP CONSTRAINT "likes_actor_did_actors_did_fk";
--> statement-breakpoint
ALTER TABLE "posts" DROP CONSTRAINT "posts_actor_did_actors_did_fk";
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_actor_did_actors_did_fk";
--> statement-breakpoint
ALTER TABLE "records" DROP CONSTRAINT "records_actor_did_actors_did_fk";
--> statement-breakpoint
ALTER TABLE "reposts" DROP CONSTRAINT "reposts_actor_did_actors_did_fk";
--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_actor_did_actors_did_fk";
--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_subject_did_actors_did_fk" FOREIGN KEY ("subject_did") REFERENCES "public"."actors"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generators" ADD CONSTRAINT "generators_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reposts" ADD CONSTRAINT "reposts_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE cascade ON UPDATE no action;