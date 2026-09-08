ALTER TABLE "sprint_steps"
  ADD COLUMN IF NOT EXISTS "kind" text NOT NULL DEFAULT 'task';
