ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "purpose" text;
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "current_thread" text;
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "evidence_note" text;
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN IF NOT EXISTS "recall_note" text;
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN IF NOT EXISTS "what_moved" text;
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN IF NOT EXISTS "what_learned" text;
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN IF NOT EXISTS "next_continuation" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_contexts" (
  "id" serial PRIMARY KEY NOT NULL,
  "context_date" date NOT NULL,
  "focus_activity_id" integer,
  "intention" text,
  "external_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "evidence_shelf" (
  "id" serial PRIMARY KEY NOT NULL,
  "activity_log_id" integer NOT NULL,
  "position" integer NOT NULL,
  "saved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "weekly_reflections" (
  "id" serial PRIMARY KEY NOT NULL,
  "week_start" date NOT NULL,
  "notice" text DEFAULT '' NOT NULL,
  "carry" text DEFAULT '' NOT NULL,
  "evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "kept_evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "saved_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_contexts" ADD CONSTRAINT "daily_contexts_focus_activity_id_activities_id_fk" FOREIGN KEY ("focus_activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "evidence_shelf" ADD CONSTRAINT "evidence_shelf_activity_log_id_activity_logs_id_fk" FOREIGN KEY ("activity_log_id") REFERENCES "public"."activity_logs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "daily_contexts_context_date_unique" ON "daily_contexts" USING btree ("context_date");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "evidence_shelf_activity_log_id_unique" ON "evidence_shelf" USING btree ("activity_log_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "evidence_shelf_position_unique" ON "evidence_shelf" USING btree ("position");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "weekly_reflections_week_start_unique" ON "weekly_reflections" USING btree ("week_start");
