import type { ComponentType, CSSProperties } from "react";
import {
  Bike,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Camera,
  Code2,
  CookingPot,
  Dumbbell,
  FlaskConical,
  Footprints,
  HeartPulse,
  Languages,
  Mountain,
  Music2,
  Palette,
  PenLine,
  PersonStanding,
  Sparkles,
  Target,
  Waves,
} from "lucide-react";

type IconComponent = ComponentType<{
  className?: string;
  style?: CSSProperties;
}>;

export const ACTIVITY_ICON_OPTIONS = [
  { value: "target", label: "Direction", icon: Target },
  { value: "book", label: "Reading", icon: BookOpen },
  { value: "brain", label: "Study", icon: Brain },
  { value: "code", label: "Code", icon: Code2 },
  { value: "writing", label: "Writing", icon: PenLine },
  { value: "palette", label: "Art", icon: Palette },
  { value: "music", label: "Music", icon: Music2 },
  { value: "languages", label: "Language", icon: Languages },
  { value: "research", label: "Research", icon: FlaskConical },
  { value: "work", label: "Work", icon: BriefcaseBusiness },
  { value: "sparkles", label: "Creative", icon: Sparkles },
  { value: "camera", label: "Photo", icon: Camera },
  { value: "cooking", label: "Cooking", icon: CookingPot },
  { value: "dumbbell", label: "Strength", icon: Dumbbell },
  { value: "run", label: "Run", icon: Footprints },
  { value: "bike", label: "Cycling", icon: Bike },
  { value: "swim", label: "Swimming", icon: Waves },
  { value: "cardio", label: "Cardio", icon: HeartPulse },
  { value: "mobility", label: "Mobility", icon: PersonStanding },
  { value: "outdoors", label: "Outdoors", icon: Mountain },
] as const;

const ICONS = new Map<string, IconComponent>(
  ACTIVITY_ICON_OPTIONS.map((option) => [option.value, option.icon]),
);

export function defaultActivityIcon(activity: {
  activityType?: "practice" | "sport";
  category?: string;
}) {
  if (activity.activityType === "sport") return "dumbbell";
  const category = activity.category?.toLowerCase() ?? "";
  if (category.includes("read")) return "book";
  if (category.includes("creative")) return "sparkles";
  if (category.includes("work")) return "work";
  if (category.includes("meditat")) return "mobility";
  return "target";
}

export function ActivityGlyph({
  icon,
  activityType = "practice",
  category,
  className,
  style,
}: {
  icon?: string | null;
  activityType?: "practice" | "sport";
  category?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const Icon =
    ICONS.get(icon ?? defaultActivityIcon({ activityType, category })) ??
    Target;
  return <Icon aria-hidden="true" className={className} style={style} />;
}
