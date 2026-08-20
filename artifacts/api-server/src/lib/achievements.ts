import { eq } from "drizzle-orm";
import {
  activitiesTable,
  activityLogsTable,
  achievementsTable,
  streaksTable,
} from "@workspace/db";
import { db } from "@workspace/db";
import { resolveActivityType } from "./activity-type";

type AchievementCandidate = {
  type: string;
  title: string;
  description: string;
  icon: string;
  activityId: number | null;
};

type ActivityForAchievement = {
  id: number;
  name: string;
  category: string;
  activityType: string | null;
};

type LogForAchievement = {
  activityId: number;
  durationMinutes: number;
  logDate: string;
};

type StreakForAchievement = {
  activityId: number;
  currentStreak: number;
};

export function findPendingAchievements({
  activities,
  logs,
  streaks,
  unlockedTypes,
}: {
  activities: ActivityForAchievement[];
  logs: LogForAchievement[];
  streaks: StreakForAchievement[];
  unlockedTypes: Set<string>;
}): AchievementCandidate[] {
  const pending: AchievementCandidate[] = [];
  const add = (achievement: AchievementCandidate) => {
    if (!unlockedTypes.has(achievement.type)) pending.push(achievement);
  };

  const activityById = new Map(
    activities.map((activity) => [activity.id, activity]),
  );
  const directionsTouched = new Set(logs.map((log) => log.activityId));
  const activeDays = new Set(logs.map((log) => log.logDate));
  const practiceMinutes = logs.reduce((total, log) => {
    const activity = activityById.get(log.activityId);
    return (
      total +
      (activity && resolveActivityType(activity) === "sport"
        ? 0
        : log.durationMinutes)
    );
  }, 0);
  const sportMinutes = logs.reduce((total, log) => {
    const activity = activityById.get(log.activityId);
    return (
      total +
      (activity && resolveActivityType(activity) === "sport"
        ? log.durationMinutes
        : 0)
    );
  }, 0);

  if (logs.length >= 1) {
    add({
      type: "first_log",
      title: "The First Mark",
      description:
        "The journey became visible with its first recorded session.",
      icon: "◇",
      activityId: null,
    });
  }
  if (logs.length >= 10) {
    add({
      type: "sessions_10",
      title: "Ten Returns",
      description: "Ten sessions made the line easier to find again.",
      icon: "✦",
      activityId: null,
    });
  }
  if (logs.length >= 25) {
    add({
      type: "sessions_25",
      title: "A Habit Takes Shape",
      description: "Twenty-five sessions gave the work a visible shape.",
      icon: "◈",
      activityId: null,
    });
  }
  if (logs.length >= 50) {
    add({
      type: "sessions_50",
      title: "Fifty Returns",
      description: "Fifty sessions now form part of your history.",
      icon: "◉",
      activityId: null,
    });
  }
  if (logs.length >= 100) {
    add({
      type: "sessions_100",
      title: "One Hundred Returns",
      description: "One hundred sessions now form part of your history.",
      icon: "✺",
      activityId: null,
    });
  }
  if (practiceMinutes >= 600) {
    add({
      type: "practice_minutes_600",
      title: "Ten Hours Invested",
      description: "Six hundred minutes of practice are now part of the line.",
      icon: "⌁",
      activityId: null,
    });
  }
  if (sportMinutes >= 180) {
    add({
      type: "sport_minutes_180",
      title: "The Body Returned",
      description:
        "Three hours of movement now hold their own place in the record.",
      icon: "◒",
      activityId: null,
    });
  }
  if (directionsTouched.size >= 3) {
    add({
      type: "directions_3",
      title: "Three Directions Awake",
      description: "You made room for three distinct directions of work.",
      icon: "△",
      activityId: null,
    });
  }
  if (directionsTouched.size >= 5) {
    add({
      type: "directions_5",
      title: "A Wider Field",
      description: "Five directions are now visible in your working landscape.",
      icon: "✧",
      activityId: null,
    });
  }
  if (activeDays.size >= 7) {
    add({
      type: "active_days_7",
      title: "A Week in View",
      description:
        "Seven active days left enough evidence to see a real pattern.",
      icon: "▦",
      activityId: null,
    });
  }

  streaks.forEach((streak) => {
    const activity = activityById.get(streak.activityId);
    if (!activity) return;

    if (streak.currentStreak >= 3) {
      add({
        type: `streak_3_${activity.id}`,
        title: "Three-Day Return",
        description: `You returned to ${activity.name} for three consecutive days.`,
        icon: "◌",
        activityId: activity.id,
      });
    }
    if (streak.currentStreak >= 7) {
      add({
        type: `streak_7_${activity.id}`,
        title: "Seven-Day Thread",
        description: `A full week kept ${activity.name} in motion.`,
        icon: "◍",
        activityId: activity.id,
      });
    }
    if (streak.currentStreak >= 30) {
      add({
        type: `streak_30_${activity.id}`,
        title: "A Month of Return",
        description: `You returned to ${activity.name} across 30 consecutive days.`,
        icon: "♛",
        activityId: activity.id,
      });
    }
  });

  return pending;
}

export async function reconcileAchievements(): Promise<AchievementCandidate[]> {
  const [activities, logs, streaks, existingAchievements] = await Promise.all([
    db
      .select({
        id: activitiesTable.id,
        name: activitiesTable.name,
        category: activitiesTable.category,
        activityType: activitiesTable.activityType,
      })
      .from(activitiesTable),
    db
      .select({
        activityId: activityLogsTable.activityId,
        durationMinutes: activityLogsTable.durationMinutes,
        logDate: activityLogsTable.logDate,
      })
      .from(activityLogsTable),
    db
      .select({
        activityId: streaksTable.activityId,
        currentStreak: streaksTable.currentStreak,
      })
      .from(streaksTable),
    db.select({ type: achievementsTable.type }).from(achievementsTable),
  ]);

  const pending = findPendingAchievements({
    activities,
    logs,
    streaks,
    unlockedTypes: new Set(
      existingAchievements.map((achievement) => achievement.type),
    ),
  });

  if (pending.length) {
    await db.insert(achievementsTable).values(pending);
  }

  return pending;
}

export async function reconcileAchievementsForActivity(
  activityId: number,
): Promise<AchievementCandidate[]> {
  const [activity] = await db
    .select({ id: activitiesTable.id })
    .from(activitiesTable)
    .where(eq(activitiesTable.id, activityId));
  if (!activity) return [];
  return reconcileAchievements();
}
