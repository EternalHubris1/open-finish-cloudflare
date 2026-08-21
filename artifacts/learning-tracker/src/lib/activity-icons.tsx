import type { ComponentType, CSSProperties } from "react";
import {
  Bike,
  BookOpen,
  Braces,
  Brain,
  Bug,
  Cloud,
  Cpu,
  Database,
  GitBranch,
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
  Network,
  Palette,
  PenLine,
  PersonStanding,
  Sparkles,
  Server,
  Target,
  Terminal,
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
  { value: "terminal", label: "Terminal", icon: Terminal },
  { value: "server", label: "Server", icon: Server },
  { value: "database", label: "Database", icon: Database },
  { value: "api", label: "API", icon: Braces },
  { value: "git", label: "Git", icon: GitBranch },
  { value: "cloud", label: "Cloud", icon: Cloud },
  { value: "network", label: "Network", icon: Network },
  { value: "cpu", label: "Systems", icon: Cpu },
  { value: "bug", label: "Bug fix", icon: Bug },
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
  activityType?: "practice" | "sport" | "friction";
  category?: string;
}) {
  if (activity.activityType === "sport") return "dumbbell";
  if (activity.activityType === "friction") return "bug";
  const category = activity.category?.toLowerCase() ?? "";
  if (category.includes("read")) return "book";
  if (category.includes("creative")) return "sparkles";
  if (category.includes("work")) return "work";
  if (category.includes("code") || category.includes("program")) return "code";
  if (category.includes("sql") || category.includes("database"))
    return "database";
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
  activityType?: "practice" | "sport" | "friction";
  category?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const Icon =
    ICONS.get(icon ?? defaultActivityIcon({ activityType, category })) ??
    Target;
  return <Icon aria-hidden="true" className={className} style={style} />;
}
