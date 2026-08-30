CREATE TYPE "public"."notification_type" AS ENUM('STOCK_CRITICAL');--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "notification_type" NOT NULL,
	"product_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"stock_real" integer NOT NULL,
	"stock_comprometido" integer NOT NULL,
	"stock_disponible" integer NOT NULL,
	"stock_minimo" integer NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_product_id_idx" ON "notification" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "notification_type_idx" ON "notification" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notification_created_at_idx" ON "notification" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notification_unread_idx" ON "notification" USING btree ("read_at","created_at");