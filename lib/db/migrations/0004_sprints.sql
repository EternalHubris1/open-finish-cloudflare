CREATE TABLE IF NOT EXISTS "sprints" (
  "id" serial PRIMARY KEY NOT NULL,
  "activity_id" integer,
  "title" text NOT NULL,
  "outcome" text NOT NULL DEFAULT '',
  "start_date" date NOT NULL,
  "due_date" date NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "completed_at" timestamp with time zone,
  CONSTRAINT "sprints_activity_id_activities_id_fk"
    FOREIGN KEY ("activity_id") REFERENCES "activities"("id")
    ON DELETE set null ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "sprint_steps" (
  "id" serial PRIMARY KEY NOT NULL,
  "sprint_id" integer NOT NULL,
  "title" text NOT NULL,
  "planned_date" date NOT NULL,
  "position" integer NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "completed_at" timestamp with time zone,
  CONSTRAINT "sprint_steps_sprint_id_sprints_id_fk"
    FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id")
    ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "sprint_steps_sprint_position_unique"
    UNIQUE("sprint_id", "position")
);
