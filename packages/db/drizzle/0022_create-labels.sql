CREATE TABLE "labels" (
	"src" varchar(256) NOT NULL,
	"uri" varchar(256) NOT NULL,
	"val" varchar(128) NOT NULL,
	"actor_did" varchar(256) NOT NULL,
	"cid" varchar(256),
	"cts" timestamp NOT NULL,
	"exp" timestamp,
	CONSTRAINT "labels_src_uri_val_pk" PRIMARY KEY("src","uri","val")
);
--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_actor_did_actors_did_fk" FOREIGN KEY ("actor_did") REFERENCES "public"."actors"("did") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "labels_uri_idx" ON "labels" USING btree ("uri");