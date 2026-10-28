CREATE TABLE "list_items" (
	"uri" varchar(256) PRIMARY KEY NOT NULL,
	"cid" varchar(256) NOT NULL,
	"actor_did" varchar(256) NOT NULL,
	"list_uri" varchar(256) NOT NULL,
	"subject_did" varchar(256) NOT NULL,
	"created_at" timestamp NOT NULL,
	"indexed_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_uri_records_uri_fk" FOREIGN KEY ("uri") REFERENCES "public"."records"("uri") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_subject_did_actors_did_fk" FOREIGN KEY ("subject_did") REFERENCES "public"."actors"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "list_items_list_uri_idx" ON "list_items" USING btree ("list_uri");--> statement-breakpoint
CREATE INDEX "list_items_subject_did_idx" ON "list_items" USING btree ("subject_did");