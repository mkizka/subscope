CREATE TABLE "post_embed_videos" (
	"post_uri" varchar(256) PRIMARY KEY NOT NULL,
	"cid" varchar(256) NOT NULL,
	"alt" text,
	"aspect_ratio_width" integer,
	"aspect_ratio_height" integer,
	"presentation" varchar(16)
);
--> statement-breakpoint
ALTER TABLE "post_embed_videos" ADD CONSTRAINT "post_embed_videos_post_uri_posts_uri_fk" FOREIGN KEY ("post_uri") REFERENCES "public"."posts"("uri") ON DELETE cascade ON UPDATE no action;