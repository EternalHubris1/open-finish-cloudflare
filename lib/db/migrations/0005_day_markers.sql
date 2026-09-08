CREATE TABLE IF NOT EXISTS "day_markers" (
  "id" serial PRIMARY KEY NOT NULL,
  "marker_date" date NOT NULL,
  "kind" text NOT NULL DEFAULT 'rest',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "day_markers_date_kind_unique"
  ON "day_markers" ("marker_date", "kind");
