CREATE TABLE "actor_stats" (
	"actor_did" varchar(256) PRIMARY KEY NOT NULL,
	"follows_count" integer DEFAULT 0 NOT NULL,
	"followers_count" integer DEFAULT 0 NOT NULL,
	"posts_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "actors" (
	"did" varchar(256) PRIMARY KEY NOT NULL,
	"handle" varchar(256),
	"backfill_status" varchar(20) DEFAULT 'dirty' NOT NULL,
	"backfill_version" integer,
	"indexed_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_items" (
	"uri" varchar(256) PRIMARY KEY NOT NULL,
	"cid" varchar(256) NOT NULL,
	"type" varchar(20) NOT NULL,
	"subject_uri" varchar(256),
	"actor_did" varchar(256) NOT NULL,
	"sort_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"uri" varchar(256) PRIMARY KEY NOT NULL,
	"cid" varchar(256) NOT NULL,
	"actor_did" varchar(256) NOT NULL,
	"subject_did" varchar(256) NOT NULL,
	"created_at" timestamp NOT NULL,
	"indexed_at" timestamp NOT NULL,
	"sort_at" timestamp GENERATED ALWAYS AS (least("created_at", "indexed_at")) STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generators" (
	"uri" varchar(256) PRIMARY KEY NOT NULL,
	"cid" varchar(256) NOT NULL,
	"actor_did" varchar(256) NOT NULL,
	"did" varchar(256) NOT NULL,
	"display_name" varchar(256) NOT NULL,
	"description" text,
	"avatar_cid" varchar(256),
	"created_at" timestamp NOT NULL,
	"indexed_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_blob_cache" (
	"cache_key" varchar(512) PRIMARY KEY NOT NULL,
	"expired_at" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'success' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"uri" varchar(256) PRIMARY KEY NOT NULL,
	"cid" varchar(256) NOT NULL,
	"actor_did" varchar(256) NOT NULL,
	"subject_uri" varchar(256) NOT NULL,
	"subject_cid" varchar(256) NOT NULL,
	"created_at" timestamp NOT NULL,
	"indexed_at" timestamp NOT NULL,
	"sort_at" timestamp GENERATED ALWAYS AS (least("created_at", "indexed_at")) STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_embed_externals" (
	"post_uri" varchar(256) PRIMARY KEY NOT NULL,
	"uri" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"thumb_cid" varchar(256)
);
--> statement-breakpoint
CREATE TABLE "post_embed_images" (
	"post_uri" varchar(256) NOT NULL,
	"cid" varchar(256) NOT NULL,
	"position" integer NOT NULL,
	"alt" text NOT NULL,
	"aspect_ratio_width" integer,
	"aspect_ratio_height" integer,
	CONSTRAINT "post_embed_images_post_uri_position_pk" PRIMARY KEY("post_uri","position")
);
--> statement-breakpoint
CREATE TABLE "post_embed_records" (
	"post_uri" varchar(256) PRIMARY KEY NOT NULL,
	"uri" varchar(256) NOT NULL,
	"cid" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_stats" (
	"post_uri" varchar(256) PRIMARY KEY NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"repost_count" integer DEFAULT 0 NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"quote_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"uri" varchar(256) PRIMARY KEY NOT NULL,
	"cid" varchar(256) NOT NULL,
	"actor_did" varchar(256) NOT NULL,
	"text" text NOT NULL,
	"reply_root_uri" varchar(256),
	"reply_root_cid" varchar(256),
	"reply_parent_uri" varchar(256),
	"reply_parent_cid" varchar(256),
	"langs" jsonb,
	"created_at" timestamp NOT NULL,
	"indexed_at" timestamp NOT NULL,
	"sort_at" timestamp GENERATED ALWAYS AS (least("created_at", "indexed_at")) STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"uri" varchar(256) PRIMARY KEY NOT NULL,
	"cid" varchar(256) NOT NULL,
	"actor_did" varchar(256) NOT NULL,
	"avatar_cid" varchar(256),
	"description" text,
	"display_name" varchar(256),
	"created_at" timestamp,
	"indexed_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "records" (
	"uri" varchar(256) PRIMARY KEY NOT NULL,
	"cid" varchar(256) NOT NULL,
	"actor_did" varchar(256) NOT NULL,
	"json" jsonb NOT NULL,
	"indexed_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reposts" (
	"uri" varchar(256) PRIMARY KEY NOT NULL,
	"cid" varchar(256) NOT NULL,
	"actor_did" varchar(256) NOT NULL,
	"subject_uri" varchar(256) NOT NULL,
	"subject_cid" varchar(256) NOT NULL,
	"created_at" timestamp NOT NULL,
	"indexed_at" timestamp NOT NULL,
	"sort_at" timestamp GENERATED ALWAYS AS (least("created_at", "indexed_at")) STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"uri" varchar(256) PRIMARY KEY NOT NULL,
	"cid" varchar(256) NOT NULL,
	"actor_did" varchar(256) NOT NULL,
	"appview_did" varchar(256) NOT NULL,
	"created_at" timestamp NOT NULL,
	"indexed_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "actor_stats" ADD CONSTRAINT "actor_stats_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_uri_records_uri_fk" FOREIGN KEY ("uri") REFERENCES "public"."records"("uri") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_uri_records_uri_fk" FOREIGN KEY ("uri") REFERENCES "public"."records"("uri") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_subject_did_actors_did_fk" FOREIGN KEY ("subject_did") REFERENCES "public"."actors"("did") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generators" ADD CONSTRAINT "generators_uri_records_uri_fk" FOREIGN KEY ("uri") REFERENCES "public"."records"("uri") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generators" ADD CONSTRAINT "generators_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_uri_records_uri_fk" FOREIGN KEY ("uri") REFERENCES "public"."records"("uri") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_embed_externals" ADD CONSTRAINT "post_embed_externals_post_uri_posts_uri_fk" FOREIGN KEY ("post_uri") REFERENCES "public"."posts"("uri") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_embed_images" ADD CONSTRAINT "post_embed_images_post_uri_posts_uri_fk" FOREIGN KEY ("post_uri") REFERENCES "public"."posts"("uri") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_embed_records" ADD CONSTRAINT "post_embed_records_post_uri_posts_uri_fk" FOREIGN KEY ("post_uri") REFERENCES "public"."posts"("uri") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_stats" ADD CONSTRAINT "post_stats_post_uri_posts_uri_fk" FOREIGN KEY ("post_uri") REFERENCES "public"."posts"("uri") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_uri_records_uri_fk" FOREIGN KEY ("uri") REFERENCES "public"."records"("uri") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_uri_records_uri_fk" FOREIGN KEY ("uri") REFERENCES "public"."records"("uri") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reposts" ADD CONSTRAINT "reposts_uri_records_uri_fk" FOREIGN KEY ("uri") REFERENCES "public"."records"("uri") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reposts" ADD CONSTRAINT "reposts_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_uri_records_uri_fk" FOREIGN KEY ("uri") REFERENCES "public"."records"("uri") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "handle_idx" ON "actors" USING btree ("handle");--> statement-breakpoint
CREATE INDEX "feed_items_sort_at_idx" ON "feed_items" USING btree ("sort_at");--> statement-breakpoint
CREATE INDEX "feed_items_actor_did_idx" ON "feed_items" USING btree ("actor_did");--> statement-breakpoint
CREATE INDEX "feed_items_actor_sort_idx" ON "feed_items" USING btree ("actor_did","sort_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "follows_sort_at_idx" ON "follows" USING btree ("sort_at");--> statement-breakpoint
CREATE INDEX "follows_actor_did_idx" ON "follows" USING btree ("actor_did");--> statement-breakpoint
CREATE INDEX "follows_subject_did_idx" ON "follows" USING btree ("subject_did");--> statement-breakpoint
CREATE INDEX "follows_actor_subject_idx" ON "follows" USING btree ("actor_did","subject_did");--> statement-breakpoint
CREATE INDEX "image_blob_cache_expired_at_idx" ON "image_blob_cache" USING btree ("expired_at");--> statement-breakpoint
CREATE INDEX "likes_sort_at_idx" ON "likes" USING btree ("sort_at");--> statement-breakpoint
CREATE INDEX "likes_subject_uri_idx" ON "likes" USING btree ("subject_uri");--> statement-breakpoint
CREATE INDEX "likes_subject_sort_idx" ON "likes" USING btree ("subject_uri","sort_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "posts_sort_at_idx" ON "posts" USING btree ("sort_at");--> statement-breakpoint
CREATE INDEX "posts_indexed_at_idx" ON "posts" USING btree ("indexed_at");--> statement-breakpoint
CREATE INDEX "posts_reply_parent_uri_idx" ON "posts" USING btree ("reply_parent_uri");--> statement-breakpoint
CREATE INDEX "posts_reply_parent_sort_idx" ON "posts" USING btree ("reply_parent_uri","sort_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "profiles_actor_idx" ON "profiles" USING btree ("actor_did");--> statement-breakpoint
CREATE INDEX "reposts_sort_at_idx" ON "reposts" USING btree ("sort_at");--> statement-breakpoint
CREATE INDEX "reposts_subject_uri_idx" ON "reposts" USING btree ("subject_uri");--> statement-breakpoint
CREATE INDEX "reposts_subject_sort_idx" ON "reposts" USING btree ("subject_uri","sort_at" DESC NULLS LAST);