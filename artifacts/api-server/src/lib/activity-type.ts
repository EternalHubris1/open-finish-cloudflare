export type ActivityType = "practice" | "sport";

const LEGACY_SPORT_CATEGORIES = new Set([
  "fitness",
  "sport",
  "sports",
  "training",
  "movement",
  "strength",
  "running",
  "cycling",
  "swimming",
  "mobility",
  "outdoors",
  "cardio",
  "body",
]);

export function resolveActivityType(activity: {
  activityType?: string | null;
  category: string;
}): ActivityType {
  if (activity.activityType === "sport") return "sport";
  if (activity.activityType === "practice") return "practice";
  return LEGACY_SPORT_CATEGORIES.has(activity.category.trim().toLowerCase())
    ? "sport"
    : "practice";
}
