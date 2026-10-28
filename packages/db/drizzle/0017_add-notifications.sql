CREATE TABLE "notifications" (
	"record_uri" varchar(256) NOT NULL,
	"recipient_did" varchar(256) NOT NULL,
	"author_did" varchar(256) NOT NULL,
	"reason" varchar(32) NOT NULL,
	"reason_subject" varchar(256),
	"sort_at" timestamp NOT NULL,
	CONSTRAINT "notifications_record_uri_recipient_did_pk" PRIMARY KEY("record_uri","recipient_did")
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "seen_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_record_uri_records_uri_fk" FOREIGN KEY ("record_uri") REFERENCES "public"."records"("uri") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_did_actors_did_fk" FOREIGN KEY ("recipient_did") REFERENCES "public"."actors"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_author_did_actors_did_fk" FOREIGN KEY ("author_did") REFERENCES "public"."actors"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_recipient_sort_idx" ON "notifications" USING btree ("recipient_did","sort_at" DESC NULLS LAST);