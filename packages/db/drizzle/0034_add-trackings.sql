CREATE TABLE "trackings" (
	"account_did" varchar(256) PRIMARY KEY NOT NULL,
	"tracked_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trackings" ADD CONSTRAINT "trackings_account_did_accounts_did_fk" FOREIGN KEY ("account_did") REFERENCES "public"."accounts"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "trackings" ("account_did", "tracked_at")
SELECT "did", "indexed_at" FROM "accounts"
WHERE "did" IN (SELECT "account_did" FROM "registrations")
   OR "did" IN (
     SELECT "follows"."subject_did" FROM "follows"
     INNER JOIN "registrations" ON "follows"."account_did" = "registrations"."account_did"
   );
