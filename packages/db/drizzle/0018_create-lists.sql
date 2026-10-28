CREATE TABLE "lists" (
	"uri" varchar(256) PRIMARY KEY NOT NULL,
	"cid" varchar(256) NOT NULL,
	"actor_did" varchar(256) NOT NULL,
	"purpose" varchar(256) NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"avatar_cid" varchar(256),
	"created_at" timestamp NOT NULL,
	"indexed_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_uri_records_uri_fk" FOREIGN KEY ("uri") REFERENCES "public"."records"("uri") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE cascade ON UPDATE no action;