import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetTodayContextQueryKey,
  useGetTodayContext,
  usePutTodayContext,
  type Activity,
} from "@workspace/api-client-react";
import { ArrowUpRight, Link2, RefreshCw, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const previewContext = {
  id: -1,
  contextDate: "2026-08-17",
  focusActivityId: 1,
  focusActivityName: "Writing",
  focusActivityColor: "#df554f",
  intention: "Keep the chapter handoff visible while I return to the draft.",
  externalUrl: "https://docs.google.com/",
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
};

function safeExternalUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function TodayPlan({
  activities,
  light,
  preview = false,
  compact = false,
  minimal = false,
}: {
  activities: Activity[];
  light: boolean;
  preview?: boolean;
  compact?: boolean;
  minimal?: boolean;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const contextQuery = useGetTodayContext({
    query: { enabled: !preview, queryKey: getGetTodayContextQueryKey() },
  });
  const updateContext = usePutTodayContext();
  const context = preview ? previewContext : contextQuery.data;
  const [intention, setIntention] = useState("");
  const [focusActivityId, setFocusActivityId] = useState<number | null>(null);
  const [externalPlanUrl, setExternalPlanUrl] = useState("");

  useEffect(() => {
    if (!context) return;
    setIntention(context.intention ?? "");
    setFocusActivityId(context.focusActivityId);
    setExternalPlanUrl(context.externalUrl ?? "");
  }, [
    context?.id,
    context?.intention,
    context?.focusActivityId,
    context?.externalUrl,
  ]);

  const externalUrl = safeExternalUrl(context?.externalUrl ?? externalPlanUrl);

  const saveContext = (event: React.FormEvent) => {
    event.preventDefault();
    if (preview) return;
    updateContext.mutate(
      {
        intention: intention.trim() || null,
        focusActivityId,
        externalUrl: externalPlanUrl.trim() || null,
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: getGetTodayContextQueryKey(),
          });
          toast({
            title: "Context saved",
            description: "One line is ready when you return.",
          });
        },
        onError: () =>
          toast({
            title: "Could not save this context",
            description: "Check the link and try again.",
            variant: "destructive",
          }),
      },
    );
  };

  if (!context && contextQuery.isLoading) {
    return (
      <section
        className={`${compact ? "h-56" : "h-64 rounded-[2rem] border"} animate-pulse ${light ? "border-black/[.08] bg-white/70" : "border-white/[.08] bg-white/[.03]"}`}
        aria-label="Loading today’s context"
      />
    );
  }

  if (!context && contextQuery.isError) {
    return (
      <section
        className={`signal-surface rounded-[2rem] border p-6 md:p-8 ${light ? "border-black/[.08] bg-white/80" : "border-white/[.08] bg-[#0c1119]/92"}`}
        role="alert"
      >
        <h2
          className={`text-xl font-semibold ${light ? "text-[#181719]" : "text-white"}`}
        >
          Today’s context could not be loaded
        </h2>
        <p
          className={`mt-2 text-sm leading-7 ${light ? "text-black/50" : "text-white/45"}`}
        >
          Nothing was changed. Try loading this small return cue again.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void contextQuery.refetch()}
          disabled={contextQuery.isFetching}
          className={`mt-5 rounded-full ${light ? "border-black/15 text-black/65" : "border-white/15 text-white/70"}`}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${contextQuery.isFetching ? "animate-spin" : ""}`}
          />
          Try again
        </Button>
      </section>
    );
  }

  return (
    <section
      className={`${compact ? "relative" : "signal-surface relative overflow-hidden rounded-[2rem] border p-6 md:p-8"} ${light ? (compact ? "text-[#181719]" : "border-black/[.08] bg-white/80") : (compact ? "text-white" : "border-white/[.08] bg-[#0c1119]/92")}`}
      aria-label={minimal ? "Today’s context" : undefined}
      aria-labelledby={minimal ? undefined : "today-context-heading"}
    >
      {!compact && (
        <div
          className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#ff7868] blur-3xl"
          style={{ opacity: light ? 0.06 : 0.1 }}
        />
      )}
      <div className={compact ? "" : "relative"}>
        {!minimal && (
          <>
            <p
              className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.24em] ${light ? "text-[#91463f]" : "text-[#ff9a89]"}`}
            >
              <Target className="h-3.5 w-3.5" /> Today’s context
            </p>
            <h2
              id="today-context-heading"
              className={`${compact ? "mt-2 text-lg" : "mt-3 text-2xl"} font-semibold ${light ? "text-[#181719]" : "text-white"}`}
            >
              Keep one useful line visible.
            </h2>
          </>
        )}
        {minimal && (
          <p
            className={`text-[9px] font-bold uppercase tracking-[.2em] ${light ? "text-black/35" : "text-white/30"}`}
          >
            Return cue
          </p>
        )}
        {!compact && (
          <p
            className={`mt-2 max-w-2xl text-sm leading-7 ${light ? "text-black/55" : "text-white/50"}`}
          >
            This is a return cue, not a task list. Name an intention, connect it
            to a direction, and keep an external source one click away if it
            helps.
          </p>
        )}

        <form
          onSubmit={saveContext}
          className={minimal ? "mt-3 space-y-3" : compact ? "mt-5 space-y-4" : "mt-7 grid gap-5 lg:grid-cols-[1fr_.75fr]"}
        >
          <div className="space-y-2">
            <label
              htmlFor="today-intention"
              className={`text-[10px] font-bold uppercase tracking-[.16em] ${light ? "text-black/45" : "text-white/40"}`}
            >
              Current intention{" "}
              <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <Textarea
              id="today-intention"
              value={intention}
              onChange={(event) => setIntention(event.target.value)}
              maxLength={280}
              rows={compact ? 2 : 4}
              placeholder="What would make the next return easier to enter?"
              className={`resize-none rounded-2xl ${light ? "border-black/10 bg-black/[.025] text-black placeholder:text-black/30" : "border-white/10 bg-white/[.035] text-white placeholder:text-white/25"}`}
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="today-focus"
                className={`text-[10px] font-bold uppercase tracking-[.16em] ${light ? "text-black/45" : "text-white/40"}`}
              >
                Direction to keep in view{" "}
                <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <select
                id="today-focus"
                value={focusActivityId ?? ""}
                onChange={(event) =>
                  setFocusActivityId(
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                className={`h-10 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-[#ff7868] ${light ? "border-black/10 bg-white text-black" : "border-white/10 bg-white/[.035] text-white"}`}
              >
                <option className="bg-white text-black" value="">
                  No direction selected
                </option>
                {activities.map((activity) => (
                  <option
                    className="bg-white text-black"
                    key={activity.id}
                    value={activity.id}
                  >
                    {activity.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="today-external-link"
                className={`text-[10px] font-bold uppercase tracking-[.16em] ${light ? "text-black/45" : "text-white/40"}`}
              >
                Context link{" "}
                <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <Input
                id="today-external-link"
                type="url"
                value={externalPlanUrl}
                onChange={(event) => setExternalPlanUrl(event.target.value)}
                maxLength={2000}
                placeholder="https://docs.google.com/..."
                aria-describedby={compact ? undefined : "today-external-link-help"}
                className={`rounded-xl ${light ? "border-black/10 bg-black/[.025] text-black placeholder:text-black/30" : "border-white/10 bg-white/[.035] text-white placeholder:text-white/25"}`}
              />
              {!compact && (
                <p
                  id="today-external-link-help"
                  className={`text-xs leading-relaxed ${light ? "text-black/40" : "text-white/35"}`}
                >
                  A Google Doc, Vikunja project, or another source. Open Finish
                  stores only the link and does not synchronize its contents.
                </p>
              )}
            </div>
          </div>
          <div className={`flex flex-wrap items-center gap-3 ${compact ? "" : "lg:col-span-2"}`}>
            <Button
              type="submit"
              disabled={updateContext.isPending || preview}
              className="rounded-full bg-[#e95448] px-6 text-[10px] font-bold uppercase tracking-[.14em] text-white hover:bg-[#f26456]"
            >
              {updateContext.isPending ? "Saving…" : "Save context"}
            </Button>
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] ${light ? "text-black/50 hover:text-black" : "text-white/45 hover:text-white"}`}
              >
                <Link2 className="h-3.5 w-3.5" /> Open context{" "}
                <span className="sr-only">in a new tab</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
