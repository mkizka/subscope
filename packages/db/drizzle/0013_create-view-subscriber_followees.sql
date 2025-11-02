CREATE MATERIALIZED VIEW "public"."subscriber_followees" AS (select distinct "follows"."subject_did" from "follows" inner join "subscriptions" on "follows"."actor_did" = "subscriptions"."actor_did");
--> statement-breakpoint
CREATE INDEX "subscriber_followees_subject_did_idx" ON "public"."subscriber_followees" USING btree ("subject_did");
