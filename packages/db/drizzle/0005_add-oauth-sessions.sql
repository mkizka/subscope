CREATE TABLE "auth_session" (
	"key" varchar(256) PRIMARY KEY NOT NULL,
	"session" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_state" (
	"key" varchar(256) PRIMARY KEY NOT NULL,
	"state" text NOT NULL
);
