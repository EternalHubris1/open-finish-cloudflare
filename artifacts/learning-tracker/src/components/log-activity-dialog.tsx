import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLogActivity,
  useUpdateLogReflection,
  getGetCalendarQueryKey,
  getGetDashboardQueryKey,
  getListActivityLogsQueryKey,
  getListReflectionsQueryKey,
  getListStreaksQueryKey,
  getGetWeeklyProgressQueryKey,
} from "@workspace/api-client-react";
import { Activity } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Sparkles } from "lucide-react";
import {
  findNearestReflectionResonance,
  type ReflectionEvidence,
  type ReflectionResonance,
} from "@/lib/reflection-resonance";

interface LogActivityDialogProps {
  activity: Activity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogged?: (result: { date: string; duration: number }) => void;
  /** A saved note or previous continuation shown only as context for the next log. */
  startingContext?: string | null;
  /** A human-readable explanation of where the supplied context came from. */
  startingContextSource?: string | null;
  /** Existing evidence for this direction, used only to show an optional earlier note after reflection. */
  priorEvidence?: ReflectionEvidence[];
}

type DialogStep = "entry" | "logged" | "reflection" | "resonance";

const emptyToNull = (value: string) => value.trim() || null;

export function LogActivityDialog({
  activity,
  open,
  onOpenChange,
  onLogged,
  startingContext,
  startingContextSource,
  priorEvidence = [],
}: LogActivityDialogProps) {
  const [durationMinutes, setDurationMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [recallNote, setRecallNote] = useState("");
  const [logDate, setLogDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  const [step, setStep] = useState<DialogStep>("entry");
  const [createdLogId, setCreatedLogId] = useState<number | null>(null);
  const [whatMoved, setWhatMoved] = useState("");
  const [whatLearned, setWhatLearned] = useState("");
  const [nextContinuation, setNextContinuation] = useState("");
  const [resonance, setResonance] = useState<ReflectionResonance | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logActivity = useLogActivity();
  const updateLogReflection = useUpdateLogReflection();

  const resetDialog = () => {
    setDurationMinutes("");
    setNotes("");
    setRecallNote("");
    setLogDate(format(new Date(), "yyyy-MM-dd"));
    setStep("entry");
    setCreatedLogId(null);
    setWhatMoved("");
    setWhatLearned("");
    setNextContinuation("");
    setResonance(null);
  };

  const closeDialog = () => {
    resetDialog();
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetDialog();
    }
    onOpenChange(nextOpen);
  };

  const invalidateSessionQueries = () => {
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    queryClient.invalidateQueries({
      queryKey: getListActivityLogsQueryKey(activity.id),
    });
    queryClient.invalidateQueries({ queryKey: getListReflectionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListStreaksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetWeeklyProgressQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetCalendarQueryKey() });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = Number(durationMinutes);
    if (duration < 1) {
      toast({
        title: "Invalid duration",
        description: "Duration must be at least 1 minute",
        variant: "destructive",
      });
      return;
    }

    logActivity.mutate(
      {
        id: activity.id,
        data: {
          durationMinutes: duration,
          notes: notes || undefined,
          recallNote: emptyToNull(recallNote) ?? undefined,
          logDate,
        },
      },
      {
        onSuccess: (log) => {
          onLogged?.({ date: logDate, duration });
          invalidateSessionQueries();
          setDurationMinutes("");
          setNotes("");
          setCreatedLogId(log.id);
          setStep("logged");
          toast({
            title: "Session logged",
            description: "Use Close the loop only if you want to add a reflection.",
          });
        },
        onError: () => {
          toast({ title: "Failed to log session", variant: "destructive" });
        },
      },
    );
  };

  const handleReflectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdLogId) return;

    updateLogReflection.mutate(
      {
        id: createdLogId,
        data: {
          whatMoved: emptyToNull(whatMoved),
          whatLearned: emptyToNull(whatLearned),
          nextContinuation: emptyToNull(nextContinuation),
        },
      },
      {
        onSuccess: () => {
          invalidateSessionQueries();
          const savedReflection = Boolean(
            emptyToNull(whatMoved) ||
            emptyToNull(whatLearned) ||
            emptyToNull(nextContinuation),
          );
          const nearbyEarlierNote = savedReflection
            ? findNearestReflectionResonance(priorEvidence, createdLogId)
            : null;
          if (nearbyEarlierNote) {
            setResonance(nearbyEarlierNote);
            setStep("resonance");
            toast({
              title: "Reflection saved",
              description:
                "An earlier note from this line is available if it helps you notice continuity.",
            });
          } else {
            toast({
              title: "Reflection saved",
              description:
                "Your next continuation is attached to this session.",
            });
            closeDialog();
          }
        },
        onError: () => {
          toast({
            title: "Could not save reflection",
            description:
              "Your session is safe. You can try again now or skip this step.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const isLogged = step === "logged";
  const isReflecting = step === "reflection";
  const isResonating = step === "resonance";
  const currentReflection =
    emptyToNull(whatLearned) ??
    emptyToNull(whatMoved) ??
    emptyToNull(nextContinuation);
  const hasReflection = Boolean(
    emptyToNull(whatMoved) ||
    emptyToNull(whatLearned) ||
    emptyToNull(nextContinuation),
  );
  const hasReentryBrief = Boolean(
    startingContext ||
    activity.currentThread ||
    activity.evidenceNote ||
    activity.purpose,
  );
  const showReentryBrief = hasReentryBrief;
  const canRecall = Boolean(
    startingContext || activity.currentThread || activity.evidenceNote,
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="rounded-3xl border-white/10 p-8 bg-[#0a0a0a] backdrop-blur-2xl shadow-2xl"
        data-testid="dialog-log-activity"
      >
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold mb-2 text-white tracking-wide">
            {isResonating
              ? "A nearby earlier note"
              : isReflecting
                ? "Close the loop"
                : isLogged
                  ? "Session marked"
                  : "Log Session"}
          </DialogTitle>
          <DialogDescription className="text-white/40 uppercase tracking-widest text-[10px] font-bold">
            {isResonating
              ? `A private echo from ${activity.name}`
              : isReflecting
                ? "Optional reflection for your next meaningful move"
                : isLogged
                  ? "Your session is saved"
                  : `Record your practice for ${activity.name}`}
          </DialogDescription>
        </DialogHeader>

        {isResonating && resonance ? (
          <section
            className="resonance-record mt-6 space-y-5"
            aria-labelledby="resonance-heading"
          >
            <p
              id="resonance-heading"
              className="rounded-2xl border border-[#ff8b7c]/20 bg-[#ff7868]/[.07] p-4 text-sm leading-relaxed text-white/60"
            >
              Your reflection is saved. This is simply the nearest earlier note
              you chose to save in this direction; Open Finish is not deciding
              whether the two notes mean the same thing.
            </p>
            {currentReflection && (
              <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
                <p className="text-[9px] font-bold uppercase tracking-[.16em] text-white/35">
                  Just saved
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  “{currentReflection}”
                </p>
              </div>
            )}
            <div className="rounded-2xl border border-[#ffc268]/20 bg-[#ffc268]/[.055] p-5">
              <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.16em] text-[#ffd18a]">
                <Sparkles className="h-3.5 w-3.5" /> Earlier{" "}
                {resonance.kind.toLowerCase()} · {resonance.date}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                “{resonance.text}”
              </p>
              <p className="mt-3 text-xs leading-relaxed text-white/40">
                Keep the connection only if it is useful. No relationship is
                recorded or inferred.
              </p>
            </div>
            <Button
              type="button"
              onClick={closeDialog}
              className="signal-button h-12 w-full rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg hover:shadow-red-500/25"
              data-testid="button-close-resonance"
            >
              Close for now
            </Button>
            <p className="sr-only" role="status" aria-live="polite">
              Reflection saved. An earlier {resonance.kind.toLowerCase()} from{" "}
              {resonance.date} is available as optional context.
            </p>
          </section>
        ) : isReflecting ? (
          <form
            onSubmit={handleReflectionSubmit}
            className="space-y-5 mt-6"
            data-testid="form-session-reflection"
          >
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-white/55">
              A few words can preserve the evidence of this session. Every field
              is optional.
            </p>

            <div className="space-y-2">
              <Label
                htmlFor="what-moved"
                className="text-[10px] uppercase tracking-widest text-white/40 font-bold"
              >
                What moved?
              </Label>
              <Textarea
                id="what-moved"
                value={whatMoved}
                onChange={(e) => setWhatMoved(e.target.value)}
                placeholder="What became clearer, stronger, or more complete?"
                maxLength={280}
                rows={2}
                className="resize-none rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-red-500"
                data-testid="input-what-moved"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="what-learned"
                className="text-[10px] uppercase tracking-widest text-white/40 font-bold"
              >
                What did you learn?
              </Label>
              <Textarea
                id="what-learned"
                value={whatLearned}
                onChange={(e) => setWhatLearned(e.target.value)}
                placeholder="A useful observation, question, or correction."
                maxLength={280}
                rows={2}
                className="resize-none rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-red-500"
                data-testid="input-what-learned"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="next-continuation"
                className="text-[10px] uppercase tracking-widest text-white/40 font-bold"
              >
                Next continuation
              </Label>
              <Textarea
                id="next-continuation"
                value={nextContinuation}
                onChange={(e) => setNextContinuation(e.target.value)}
                placeholder="What is the smallest useful next step?"
                maxLength={280}
                rows={2}
                className="resize-none rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-red-500"
                data-testid="input-next-continuation"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                className="flex-1 rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white backdrop-blur-xl"
                data-testid="button-skip-reflection"
              >
                Skip for now
              </Button>
              <Button
                type="submit"
                disabled={updateLogReflection.isPending || !hasReflection}
                className="flex-1 rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-lg hover:shadow-red-500/25 border-0 hover:scale-[1.02] active:scale-[0.98] transition-all"
                data-testid="button-save-reflection"
              >
                {updateLogReflection.isPending
                  ? "Saving..."
                  : "Save reflection"}
              </Button>
            </div>
          </form>
        ) : isLogged ? (
          <section className="mt-6 space-y-4" aria-label="Session saved">
            <p className="text-sm leading-6 text-white/60">
              This session is marked. Reflection is optional and stays attached
              to this specific session.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("reflection")}
                className="h-10 rounded-xl border-[#ff7868]/35 bg-[#ff7868]/10 px-4 text-[10px] font-bold uppercase tracking-[.12em] text-[#ffb1a7] hover:bg-[#ff7868]/20 hover:text-white"
                data-testid="button-open-reflection"
              >
                Reflect on this session
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={closeDialog}
                className="h-10 rounded-xl px-4 text-[10px] font-bold uppercase tracking-[.12em] text-white/45 hover:bg-white/[.05] hover:text-white"
                data-testid="button-finish-session"
              >
                Done
              </Button>
            </div>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {showReentryBrief && (
              <aside
                className="rounded-2xl border border-[#ff8b7c]/20 bg-[#ff7868]/[.07] p-4"
                aria-label="Re-entry briefing"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#ff9a89]">
                  Re-entry brief
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  Use only the context that helps you begin. This session is
                  allowed to take a different shape.
                </p>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  {startingContext && (
                    <div className="rounded-xl border border-white/10 bg-black/10 p-3 sm:col-span-2">
                      <dt className="text-[9px] font-bold uppercase tracking-[.14em] text-[#ffb1a7]">
                        {startingContextSource ?? "Last continuation"}
                      </dt>
                      <dd className="mt-1 text-sm leading-relaxed text-white/80">
                        “{startingContext}”
                      </dd>
                    </div>
                  )}
                  {activity.currentThread && (
                    <div>
                      <dt className="text-[9px] font-bold uppercase tracking-[.14em] text-white/35">
                        Current thread
                      </dt>
                      <dd className="mt-1 text-sm leading-relaxed text-white/70">
                        {activity.currentThread}
                      </dd>
                    </div>
                  )}
                  {activity.evidenceNote && (
                    <div>
                      <dt className="text-[9px] font-bold uppercase tracking-[.14em] text-white/35">
                        Visible progress
                      </dt>
                      <dd className="mt-1 text-sm leading-relaxed text-white/70">
                        {activity.evidenceNote}
                      </dd>
                    </div>
                  )}
                  {activity.purpose && (
                    <div className="sm:col-span-2 border-t border-white/8 pt-3">
                      <dt className="text-[9px] font-bold uppercase tracking-[.14em] text-white/35">
                        Why this line exists
                      </dt>
                      <dd className="mt-1 text-sm leading-relaxed text-white/55">
                        {activity.purpose}
                      </dd>
                    </div>
                  )}
                </dl>
              </aside>
            )}
            {canRecall && (
              <div className="space-y-2">
                <Label
                  htmlFor="recall-note"
                  className="text-[10px] uppercase tracking-widest text-white/40 font-bold"
                >
                  Recall checkpoint{" "}
                  <span className="normal-case tracking-normal">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="recall-note"
                  value={recallNote}
                  onChange={(event) => setRecallNote(event.target.value)}
                  placeholder="Before looking at notes: what do you remember, understand, or want to test?"
                  maxLength={280}
                  rows={2}
                  className="resize-none rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-red-500"
                  data-testid="input-recall-note"
                />
                <p className="text-[11px] leading-relaxed text-white/35">
                  A quick attempt to recall is evidence for you, not a test to
                  pass. Skip it if it would not help today.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="duration"
                  className="text-[10px] uppercase tracking-widest text-white/40 font-bold"
                >
                  Duration (minutes)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="30"
                  required
                  className="rounded-2xl h-12 text-base bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-red-500 backdrop-blur-xl"
                  data-testid="input-duration"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="log-date"
                  className="text-[10px] uppercase tracking-widest text-white/40 font-bold"
                >
                  Date
                </Label>
                <Input
                  id="log-date"
                  type="date"
                  max={format(new Date(), "yyyy-MM-dd")}
                  value={logDate}
                  onChange={(event) => setLogDate(event.target.value)}
                  required
                  className="rounded-2xl h-12 bg-white/5 border-white/10 text-white focus-visible:ring-red-500 [color-scheme:dark]"
                  data-testid="input-log-date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="notes"
                className="text-[10px] uppercase tracking-widest text-white/40 font-bold"
              >
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you focus on?"
                rows={3}
                className="rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-red-500 backdrop-blur-xl resize-none"
                data-testid="input-notes"
              />
            </div>

            <div className="flex gap-4 pt-6 mt-8 border-t border-white/5">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                className="flex-1 rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white backdrop-blur-xl"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={logActivity.isPending}
                className="flex-1 rounded-2xl h-12 uppercase tracking-wider text-[11px] font-bold bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-lg hover:shadow-red-500/25 border-0 hover:scale-[1.02] active:scale-[0.98] transition-all"
                data-testid="button-submit-log"
              >
                {logActivity.isPending ? "Logging..." : "Log Session"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
