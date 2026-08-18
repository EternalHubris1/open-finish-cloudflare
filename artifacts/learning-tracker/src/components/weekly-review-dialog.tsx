import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListWeeklyReflectionsQueryKey,
  usePutWeeklyReflection,
  type KeptEvidence,
  type WeeklyReflection,
} from "@workspace/api-client-react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ClipboardCopy,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface WeeklyReviewEvidence {
  id: string;
  activityName: string;
  logDate: string;
  label: "Shift" | "Learning" | "Next step" | "Recall";
  text: string;
}

interface WeeklyReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  light: boolean;
  weekStart: string;
  minutes: number;
  activeDays: number;
  evidence: WeeklyReviewEvidence[];
  keptEvidence: KeptEvidence[];
  existingReview?: WeeklyReflection;
  preview?: boolean;
}

function minutesLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h${rest ? ` ${rest}m` : ""}` : `${rest}m`;
}

export function WeeklyReviewDialog({
  open,
  onOpenChange,
  light,
  weekStart,
  minutes,
  activeDays,
  evidence,
  keptEvidence,
  existingReview,
  preview = false,
}: WeeklyReviewDialogProps) {
  const queryClient = useQueryClient();
  const saveWeeklyReflection = usePutWeeklyReflection();
  const [step, setStep] = useState(0);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [selectedKeptEvidenceIds, setSelectedKeptEvidenceIds] = useState<
    number[]
  >([]);
  const [notice, setNotice] = useState("");
  const [carry, setCarry] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedEvidence = useMemo(
    () => evidence.filter((entry) => selectedEvidenceIds.includes(entry.id)),
    [evidence, selectedEvidenceIds],
  );

  const selectedKeptEvidence = useMemo(
    () =>
      keptEvidence.filter((entry) =>
        selectedKeptEvidenceIds.includes(entry.id),
      ),
    [keptEvidence, selectedKeptEvidenceIds],
  );
  const selectedContext = useMemo(
    () => [
      ...selectedEvidence.map((entry) => ({
        label: entry.label,
        activityName: entry.activityName,
        logDate: entry.logDate,
        text: entry.text,
      })),
      ...selectedKeptEvidence.map((entry) => ({
        label: "Kept note",
        activityName: entry.activityName,
        logDate: entry.logDate,
        text: entry.text,
      })),
    ],
    [selectedEvidence, selectedKeptEvidence],
  );

  const draft = useMemo(() => {
    const rhythm =
      activeDays === 0
        ? "The week has no recorded returns yet."
        : `${minutesLabel(minutes)} across ${activeDays} ${activeDays === 1 ? "active day" : "active days"}.`;
    const evidenceLine = selectedContext.length
      ? ` The evidence I want to keep close: ${selectedContext.map((entry) => `${entry.activityName} — ${entry.text}`).join(" · ")}`
      : "";
    const noticeLine = notice.trim() ? ` What I notice: ${notice.trim()}` : "";
    const carryLine = carry.trim() ? ` I want to carry: ${carry.trim()}` : "";
    return `${rhythm}${evidenceLine}${noticeLine}${carryLine}`.trim();
  }, [activeDays, carry, minutes, notice, selectedContext]);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setSaved(false);
    setCopied(false);
    setNotice(existingReview?.notice ?? "");
    setCarry(existingReview?.carry ?? "");
    setSelectedEvidenceIds(existingReview?.evidenceIds ?? []);
    setSelectedKeptEvidenceIds(
      (existingReview?.keptEvidenceIds ?? []).filter((id) =>
        keptEvidence.some((entry) => entry.id === id),
      ),
    );
  }, [existingReview, keptEvidence, open]);

  const toggleEvidence = (id: string) => {
    setSelectedEvidenceIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  };

  const toggleKeptEvidence = (id: number) => {
    setSelectedKeptEvidenceIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  };

  const finishReview = async () => {
    setSaved(false);
    if (preview) {
      setSaved(true);
      return true;
    }
    try {
      await saveWeeklyReflection.mutateAsync({
        weekStart,
        notice,
        carry,
        evidenceIds: selectedEvidenceIds,
        keptEvidenceIds: selectedKeptEvidenceIds,
      });
      await queryClient.invalidateQueries({
        queryKey: getListWeeklyReflectionsQueryKey(),
      });
      setSaved(true);
      return true;
    } catch {
      return false;
    }
  };

  const weeklySnapshotText = useMemo(
    () =>
      [
        `Open Finish — weekly reflection (week of ${weekStart})`,
        "",
        "Recorded facts",
        `- ${minutesLabel(minutes)} across ${activeDays} ${activeDays === 1 ? "active day" : "active days"}.`,
        selectedContext.length
          ? [
              "",
              "Evidence I chose to keep close",
              ...selectedContext.map(
                (entry) =>
                  `- ${entry.label} · ${entry.activityName} (${entry.logDate}): ${entry.text}`,
              ),
            ]
          : null,
        notice.trim() ? ["", "What I notice", notice.trim()] : null,
        carry.trim() ? ["", "What I want to carry", carry.trim()] : null,
        "",
        "This is a personal reading of recorded context, not a score.",
      ]
        .flat()
        .filter(
          (line, index, lines) =>
            line !== null && !(line === "" && lines[index - 1] === ""),
        )
        .join("\n"),
    [activeDays, carry, minutes, notice, selectedContext, weekStart],
  );

  const copyWeeklySnapshot = async () => {
    setCopied(false);
    if (!(await finishReview())) return;
    try {
      await navigator.clipboard.writeText(weeklySnapshotText);
    } catch {
      const target = document.createElement("textarea");
      target.value = weeklySnapshotText;
      target.style.position = "fixed";
      target.style.opacity = "0";
      document.body.appendChild(target);
      target.select();
      document.execCommand("copy");
      document.body.removeChild(target);
    }
    setCopied(true);
  };

  const stepTitle = [
    "Notice the week",
    "Choose evidence",
    "Name what matters",
    "Keep a short record",
  ][step];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-h-[90vh] overflow-y-auto rounded-3xl border p-6 shadow-2xl md:p-8 ${light ? "border-black/10 bg-white text-[#181719]" : "border-white/10 bg-[#0a0d13] text-white"}`}
        data-testid="dialog-weekly-review"
      >
        <DialogHeader>
          <p
            className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.22em] ${light ? "text-[#91463f]" : "text-[#ff9a89]"}`}
          >
            <Sparkles className="h-3.5 w-3.5" /> A private weekly conversation
          </p>
          <DialogTitle className="mt-3 text-3xl font-semibold tracking-tight">
            {stepTitle}
          </DialogTitle>
          <DialogDescription
            className={light ? "text-black/45" : "text-white/45"}
          >
            One small question at a time. This is a reading of your records, not
            a score.
          </DialogDescription>
        </DialogHeader>

        <div
          className="mt-6 flex items-center gap-2"
          aria-label="Weekly review progress"
        >
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-[#e95448]" : light ? "bg-black/10" : "bg-white/10"}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="mt-7 space-y-4">
            <p
              className={`text-sm leading-7 ${light ? "text-black/60" : "text-white/60"}`}
            >
              Begin with the plain record. No outcome needs to be judged before
              it is seen.
            </p>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div
                className={`rounded-2xl border p-5 ${light ? "border-black/10 bg-black/[.025]" : "border-white/10 bg-white/[.025]"}`}
              >
                <dt
                  className={`text-[9px] font-bold uppercase tracking-[.16em] ${light ? "text-black/40" : "text-white/35"}`}
                >
                  Effort
                </dt>
                <dd className="mt-2 text-3xl font-semibold">
                  {minutesLabel(minutes)}
                </dd>
                <p
                  className={`mt-1 text-xs ${light ? "text-black/45" : "text-white/40"}`}
                >
                  Recorded this week.
                </p>
              </div>
              <div
                className={`rounded-2xl border p-5 ${light ? "border-black/10 bg-black/[.025]" : "border-white/10 bg-white/[.025]"}`}
              >
                <dt
                  className={`text-[9px] font-bold uppercase tracking-[.16em] ${light ? "text-black/40" : "text-white/35"}`}
                >
                  Rhythm
                </dt>
                <dd className="mt-2 text-3xl font-semibold">{activeDays}/7</dd>
                <p
                  className={`mt-1 text-xs ${light ? "text-black/45" : "text-white/40"}`}
                >
                  Days you returned.
                </p>
              </div>
            </dl>
          </div>
        )}

        {step === 1 && (
          <div className="mt-7 space-y-3">
            <p
              className={`text-sm leading-7 ${light ? "text-black/60" : "text-white/60"}`}
            >
              Which records, if any, are worth carrying into your reading of the
              week?
            </p>
            {evidence.length ? (
              evidence.map((entry) => {
                const selected = selectedEvidenceIds.includes(entry.id);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => toggleEvidence(entry.id)}
                    aria-pressed={selected}
                    className={`continuity-card continuity-action w-full rounded-2xl border p-4 text-left ${selected ? "border-[#e95448]/55 bg-[#e95448]/[.08]" : light ? "border-black/10 hover:bg-black/[.025]" : "border-white/10 hover:bg-white/[.03]"}`}
                  >
                    <span
                      className={`text-[9px] font-bold uppercase tracking-[.15em] ${selected ? "text-[#e95448]" : light ? "text-black/40" : "text-white/35"}`}
                    >
                      {entry.label} · {entry.activityName}
                    </span>
                    <p
                      className={`mt-2 text-sm leading-relaxed ${light ? "text-black/70" : "text-white/70"}`}
                    >
                      {entry.text}
                    </p>
                  </button>
                );
              })
            ) : (
              <p
                className={`rounded-2xl border border-dashed p-5 text-sm leading-relaxed ${light ? "border-black/15 text-black/45" : "border-white/15 text-white/45"}`}
              >
                No reflection evidence was saved this week. You can still name
                what you notice from the rhythm.
              </p>
            )}
            {keptEvidence.length > 0 && (
              <div
                className={`mt-5 border-t pt-5 ${light ? "border-black/10" : "border-white/10"}`}
              >
                <p
                  className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.16em] ${light ? "text-[#91463f]" : "text-[#ff9a89]"}`}
                >
                  <Bookmark className="h-3.5 w-3.5" /> Notes you kept close
                </p>
                <p
                  className={`mt-2 text-xs leading-relaxed ${light ? "text-black/45" : "text-white/40"}`}
                >
                  These personal notes may come from any time. Include one only
                  if it helps you read this week more clearly.
                </p>
                <div className="mt-3 space-y-3">
                  {keptEvidence.map((entry) => {
                    const selected = selectedKeptEvidenceIds.includes(entry.id);
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => toggleKeptEvidence(entry.id)}
                        aria-pressed={selected}
                        className={`continuity-card continuity-action w-full rounded-2xl border p-4 text-left ${selected ? "border-[#e95448]/55 bg-[#e95448]/[.08]" : light ? "border-black/10 hover:bg-black/[.025]" : "border-white/10 hover:bg-white/[.03]"}`}
                      >
                        <span
                          className={`text-[9px] font-bold uppercase tracking-[.15em] ${selected ? "text-[#e95448]" : light ? "text-black/40" : "text-white/35"}`}
                        >
                          Kept note · {entry.activityName}
                        </span>
                        <p
                          className={`mt-2 text-sm leading-relaxed ${light ? "text-black/70" : "text-white/70"}`}
                        >
                          {entry.text}
                        </p>
                        <p
                          className={`mt-3 text-[10px] font-bold uppercase tracking-[.13em] ${light ? "text-black/35" : "text-white/30"}`}
                        >
                          Saved evidence · {entry.logDate}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="weekly-review-notice"
                className={`text-[10px] font-bold uppercase tracking-[.16em] ${light ? "text-black/45" : "text-white/40"}`}
              >
                What do you notice?{" "}
                <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <Textarea
                id="weekly-review-notice"
                value={notice}
                onChange={(event) => setNotice(event.target.value)}
                placeholder="A pattern, surprise, friction, or useful change."
                rows={3}
                maxLength={360}
                className={`mt-2 resize-none rounded-2xl ${light ? "border-black/10 bg-black/[.02]" : "border-white/10 bg-white/[.04] text-white placeholder:text-white/25"}`}
              />
            </div>
            <div>
              <label
                htmlFor="weekly-review-carry"
                className={`text-[10px] font-bold uppercase tracking-[.16em] ${light ? "text-black/45" : "text-white/40"}`}
              >
                What could make next week easier to enter?{" "}
                <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <Textarea
                id="weekly-review-carry"
                value={carry}
                onChange={(event) => setCarry(event.target.value)}
                placeholder="One condition, context cue, or gentle continuation."
                rows={3}
                maxLength={360}
                className={`mt-2 resize-none rounded-2xl ${light ? "border-black/10 bg-black/[.02]" : "border-white/10 bg-white/[.04] text-white placeholder:text-white/25"}`}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-7 space-y-4">
            <p
              className={`text-sm leading-7 ${light ? "text-black/60" : "text-white/60"}`}
            >
              This is an editable synthesis of what you selected and named. It
              is saved with your Open Finish reflections.
            </p>
            <blockquote
              className={`rounded-2xl border-l-2 p-5 text-sm leading-7 ${light ? "border-[#e95448]/55 bg-black/[.02] text-black/70" : "border-[#ff8b7c]/55 bg-white/[.025] text-white/75"}`}
            >
              {draft ||
                "Choose evidence or add a note to shape this short record."}
            </blockquote>
            {saved && (
              <p
                role="status"
                className={`flex items-center gap-2 text-xs ${light ? "text-[#91463f]" : "text-[#ffb1a7]"}`}
              >
                <Check className="h-4 w-4" /> Saved with your reflections for
                this week.
              </p>
            )}
            {saveWeeklyReflection.isError && (
              <p role="alert" className="text-xs text-red-300">
                This reflection could not be saved. Your text is still here; try
                again.
              </p>
            )}
            {copied && (
              <p
                role="status"
                className={`flex items-center gap-2 text-xs ${light ? "text-[#91463f]" : "text-[#ffb1a7]"}`}
              >
                <ClipboardCopy className="h-4 w-4" /> Weekly text snapshot
                copied privately to your clipboard.
              </p>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              step === 0
                ? onOpenChange(false)
                : setStep((current) => current - 1)
            }
            className={`continuity-action rounded-2xl ${light ? "text-black/55 hover:bg-black/[.05]" : "text-white/55 hover:bg-white/[.05]"}`}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {step === 0 ? "Close" : "Back"}
          </Button>
          {step < 3 ? (
            <Button
              type="button"
              onClick={() => setStep((current) => current + 1)}
              className="continuity-action rounded-2xl bg-[#e95448] text-white hover:bg-[#f26456]"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => void copyWeeklySnapshot()}
                disabled={saveWeeklyReflection.isPending}
                data-copied={copied}
                className={`copy-action continuity-action rounded-2xl ${light ? "border-black/15 bg-black/[.02] text-black/65 hover:bg-black/[.06]" : "border-white/15 bg-white/[.035] text-white/70 hover:bg-white/[.08]"}`}
              >
                {copied ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy as text"}
              </Button>
              <Button
                type="button"
                onClick={() => void finishReview()}
                disabled={saveWeeklyReflection.isPending}
                className="continuity-action rounded-2xl bg-[#e95448] text-white hover:bg-[#f26456]"
              >
                <Check className="mr-2 h-4 w-4" />
                {saveWeeklyReflection.isPending
                  ? "Saving…"
                  : "Keep this reflection"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
