CREATE TABLE "invite_codes" (
	"code" varchar(256) PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
