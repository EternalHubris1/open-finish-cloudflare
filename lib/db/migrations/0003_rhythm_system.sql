CREATE TABLE IF NOT EXISTS "milestones" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "detail" text,
  "period" text NOT NULL,
  "due_date" date NOT NULL,
  "status" text NOT NULL DEFAULT 'open',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "completed_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "period_reflections" (
  "id" serial PRIMARY KEY NOT NULL,
  "milestone_id" integer NOT NULL,
  "notice" text NOT NULL DEFAULT '',
  "carry" text NOT NULL DEFAULT '',
  "saved_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "period_reflections_milestone_id_unique" UNIQUE("milestone_id"),
  CONSTRAINT "period_reflections_milestone_id_milestones_id_fk"
    FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id")
    ON DELETE cascade ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "dojo_cabinet_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "period_reflection_id" integer,
  "title" text NOT NULL,
  "url" text,
  "note" text NOT NULL DEFAULT '',
  "kind" text NOT NULL DEFAULT 'link',
  "position" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "dojo_cabinet_items_period_reflection_id_period_reflections_id_fk"
    FOREIGN KEY ("period_reflection_id") REFERENCES "period_reflections"("id")
    ON DELETE set null ON UPDATE no action
);
