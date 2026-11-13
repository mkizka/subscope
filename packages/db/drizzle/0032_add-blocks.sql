CREATE TABLE "blocks" (
	"uri" varchar(256) PRIMARY KEY NOT NULL,
	"cid" varchar(256) NOT NULL,
	"account_did" varchar(256) NOT NULL,
	"subject_did" varchar(256) NOT NULL,
	"created_at" timestamp NOT NULL,
	"indexed_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_uri_records_uri_fk" FOREIGN KEY ("uri") REFERENCES "public"."records"("uri") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_account_did_accounts_did_fk" FOREIGN KEY ("account_did") REFERENCES "public"."accounts"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_subject_did_accounts_did_fk" FOREIGN KEY ("subject_did") REFERENCES "public"."accounts"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blocks_account_subject_idx" ON "blocks" USING btree ("account_did","subject_did");--> statement-breakpoint
CREATE INDEX "blocks_subject_account_idx" ON "blocks" USING btree ("subject_did","account_did");