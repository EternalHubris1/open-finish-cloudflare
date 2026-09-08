import { useQueryClient } from "@tanstack/react-query";
import {
  getGetCalendarQueryKey,
  getGetDashboardQueryKey,
  getListStreaksQueryKey,
  useDeleteRestDay,
  usePutRestDay,
} from "@workspace/api-client-react";
import { LoaderCircle, MoonStar, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface RestDayToggleProps {
  date: string;
  restDay: boolean;
  disabled?: boolean;
  light?: boolean;
  compact?: boolean;
}

export function RestDayToggle({
  date,
  restDay,
  disabled = false,
  light = false,
  compact = false,
}: RestDayToggleProps) {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetCalendarQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListStreaksQueryKey() }),
    ]);
  };
  const putRestDay = usePutRestDay({
    mutation: {
      onSuccess: async () => {
        await refresh();
        toast({
          title: "Rest day marked",
          description: "Existing sessions remain visible; the day pauses streak continuity.",
        });
      },
      onError: () =>
        toast({
          title: "Couldn’t mark the rest day",
          description: "Your activity records were not changed. Try again.",
          variant: "destructive",
        }),
    },
  });
  const deleteRestDay = useDeleteRestDay({
    mutation: {
      onSuccess: async () => {
        await refresh();
        toast({ title: "Rest day removed" });
      },
      onError: () =>
        toast({
          title: "Couldn’t remove the rest day",
          description: "Nothing was changed. Try again.",
          variant: "destructive",
        }),
    },
  });
  const pending = putRestDay.isPending || deleteRestDay.isPending;
  const Icon = pending ? LoaderCircle : restDay ? RotateCcw : MoonStar;

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() =>
        restDay
          ? deleteRestDay.mutate({ date })
          : putRestDay.mutate({ date })
      }
      className={cn(
        "signal-button inline-flex items-center justify-center gap-2 rounded-xl border font-bold uppercase tracking-[.13em] transition-[background-color,border-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4c8e6] disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none",
        compact ? "h-8 px-2.5 text-[8px]" : "h-10 px-3.5 text-[9px]",
        restDay
          ? light
            ? "border-[#536987]/22 bg-[#607896]/10 text-[#344b69] hover:bg-[#607896]/16"
            : "border-[#a8bcda]/25 bg-[#7186a6]/12 text-[#c2d2e9] hover:bg-[#7186a6]/20"
          : light
            ? "border-black/10 bg-white/45 text-black/48 hover:border-[#536987]/25 hover:text-[#344b69]"
            : "border-white/10 bg-white/[.035] text-white/48 hover:border-[#a8bcda]/25 hover:text-[#c2d2e9]",
      )}
      aria-label={restDay ? `Remove rest day for ${date}` : `Mark ${date} as a rest day`}
      aria-pressed={restDay}
    >
      <Icon className={cn("h-3.5 w-3.5", pending && "animate-spin motion-reduce:animate-none")} />
      {restDay ? "Rest day · undo" : "Mark rest day"}
    </button>
  );
}
