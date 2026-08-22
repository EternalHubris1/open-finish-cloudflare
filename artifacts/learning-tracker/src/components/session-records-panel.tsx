import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetCalendarQueryKey,
  getGetDashboardQueryKey,
  getGetWeeklyProgressQueryKey,
  getListLogRecordsQueryKey,
  getListStreaksQueryKey,
  useDeleteLog,
  useListLogRecords,
  useUpdateLogRecord,
  type CalendarLogEntry,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import verticalOrnament from "@/assets/patterns/japanese-ornament-transparent-v2-cropped.png";
import { moscowOperationalDate } from "@/lib/operational-date";

type RecordFilter = "all" | "practice" | "sport" | "friction";

const FILTERS: Array<{ value: RecordFilter; label: string }> = [
  { value: "all", label: "All records" },
  { value: "practice", label: "Practice" },
  { value: "sport", label: "Sport" },
  { value: "friction", label: "Friction" },
];

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours && remaining) return `${hours}h ${remaining}m`;
  if (hours) return `${hours}h`;
  return `${remaining}m`;
}

function recordDate(logDate: string) {
  return format(new Date(`${logDate}T00:00:00`), "EEE, MMM d");
}

export function SessionRecordsPanel() {
  const {
    data: records = [],
    isLoading,
    isError,
    refetch,
  } = useListLogRecords();
  const updateRecord = useUpdateLogRecord();
  const deleteLog = useDeleteLog();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RecordFilter>("all");
  const [editing, setEditing] = useState<CalendarLogEntry | null>(null);
  const [deleting, setDeleting] = useState<CalendarLogEntry | null>(null);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [logDate, setLogDate] = useState("");
  const [notes, setNotes] = useState("");

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesFilter = filter === "all" || record.activityType === filter;
      const matchesSearch =
        !normalizedSearch ||
        record.activityName.toLowerCase().includes(normalizedSearch) ||
        record.notes?.toLowerCase().includes(normalizedSearch) ||
        record.logDate.includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [filter, records, search]);

  const invalidateSessionViews = () => {
    void queryClient.invalidateQueries({
      queryKey: getListLogRecordsQueryKey(),
    });
    void queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetCalendarQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getListStreaksQueryKey() });
    void queryClient.invalidateQueries({
      queryKey: getGetWeeklyProgressQueryKey(),
    });
  };

  const openEditor = (record: CalendarLogEntry) => {
    setEditing(record);
    setDurationMinutes(String(record.durationMinutes));
    setLogDate(record.logDate);
    setNotes(record.notes ?? "");
  };

  const saveRecord = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const nextDuration = Number(durationMinutes);
    if (!Number.isInteger(nextDuration) || nextDuration < 1) {
      toast({
        title: "Enter a valid duration",
        description: "A session must be at least one minute.",
        variant: "destructive",
      });
      return;
    }
    if (!logDate || logDate > moscowOperationalDate()) {
      toast({
        title: "Choose a completed day",
        description: "Session records cannot be moved into the future.",
        variant: "destructive",
      });
      return;
    }

    updateRecord.mutate(
      {
        id: editing.id,
        data: {
          durationMinutes: nextDuration,
          logDate,
          notes: notes.trim() || null,
        },
      },
      {
        onSuccess: () => {
          invalidateSessionViews();
          setEditing(null);
          toast({ title: "Session record updated" });
        },
        onError: () => {
          toast({
            title: "Could not update the record",
            description: "Your existing session entry has not been changed.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    deleteLog.mutate(
      { id: deleting.id },
      {
        onSuccess: () => {
          invalidateSessionViews();
          toast({ title: "Session record deleted" });
          setDeleting(null);
        },
        onError: () => {
          toast({
            title: "Could not delete the record",
            description: "The saved session remains intact.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <section className="signal-surface relative isolate overflow-hidden rounded-3xl border border-white/[.08] bg-[#0c1119]/92 p-5 shadow-[0_18px_55px_rgba(0,0,0,.18)] md:p-7">
      <img
        src={verticalOrnament}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-14 top-1/2 h-[28rem] max-h-[118%] w-auto -translate-y-1/2 select-none opacity-[.3] brightness-[1.14] saturate-[.82]"
      />
      <div className="relative z-10">
        <button
          type="button"
          aria-expanded={recordsOpen}
          aria-controls="session-records-content"
          onClick={() => {
            setRecordsOpen((open) => !open);
            setExpandedRecordId(null);
          }}
          className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-white/[.08] bg-black/[.12] px-4 py-3 text-left transition-[background-color,border-color] duration-150 hover:border-white/[.15] hover:bg-white/[.03] active:scale-[.995]"
        >
          <span>
            <span className="block text-[8px] font-bold uppercase tracking-[.18em] text-[#72c6b3]">
              Record stewardship
            </span>
            <span className="mt-1 block text-base font-semibold text-white">
              Session records
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-3">
            <span className="rounded-full border border-white/[.08] bg-white/[.035] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.12em] text-white/42">
              {filteredRecords.length} shown
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/[.08] bg-white/[.025] text-white/42 transition-[background-color,transform,color] duration-150 group-hover:bg-white/[.08] group-hover:text-white/82">
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${recordsOpen ? "rotate-180" : ""}`}
              />
            </span>
          </span>
        </button>

        {recordsOpen && (
          <div id="session-records-content" className="mt-3">
            <div className="flex flex-col gap-3 rounded-2xl border border-white/[.07] bg-black/[.14] p-3 lg:flex-row lg:items-center lg:justify-between">
              <div
                className="flex flex-wrap gap-2"
                aria-label="Filter session records"
              >
                {FILTERS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value)}
                    className={`signal-button rounded-xl border px-3 py-2 text-[9px] font-bold uppercase tracking-[.13em] transition-colors ${
                      filter === item.value
                        ? "border-[#72c6b3]/35 bg-[#72c6b3]/[.11] text-[#a9ead8]"
                        : "border-white/[.07] bg-white/[.02] text-white/42 hover:border-white/[.16] hover:text-white/75"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-white/[.08] bg-[#090d14]/85 px-3 text-white/45 lg:w-72">
                <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Find a record"
                  className="h-auto border-0 bg-transparent p-0 text-xs text-white placeholder:text-white/28 focus-visible:ring-0"
                />
              </label>
            </div>

            <div className="mt-4 space-y-2">
              {isLoading ? (
                Array.from({ length: 4 }, (_, index) => (
                  <Skeleton
                    key={index}
                    className="h-20 rounded-2xl bg-white/[.045]"
                  />
                ))
              ) : isError ? (
                <div className="rounded-2xl border border-[#ff8b7c]/20 bg-[#ff8b7c]/[.05] px-4 py-5 text-center">
                  <p className="text-sm font-medium text-white/76">
                    Records could not be opened.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void refetch()}
                    className="mt-3 rounded-xl border-white/[.12] text-[9px] font-bold uppercase tracking-[.14em] text-white/72 hover:bg-white/[.06]"
                  >
                    Try again
                  </Button>
                </div>
              ) : filteredRecords.length ? (
                filteredRecords.map((record) => {
                  const isExpanded = expandedRecordId === record.id;
                  const detailId = `session-record-${record.id}`;

                  return (
                    <article
                      key={record.id}
                      className="overflow-hidden rounded-2xl border border-white/[.07] bg-white/[.018] transition-[border-color,background-color] duration-150 hover:border-white/[.14] hover:bg-white/[.03]"
                    >
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={detailId}
                        onClick={() =>
                          setExpandedRecordId((current) =>
                            current === record.id ? null : record.id,
                          )
                        }
                        className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-white/[.025] active:scale-[.995] sm:px-3.5"
                      >
                        <span
                          className="h-8 w-1 shrink-0 rounded-full shadow-[0_0_12px_currentColor]"
                          style={{
                            backgroundColor: record.activityColor,
                            color: record.activityColor,
                          }}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="truncate text-[13px] font-semibold text-white">
                              {record.activityName}
                            </span>
                            <span className="text-[8px] font-bold uppercase tracking-[.13em] text-white/35">
                              {record.activityType}
                            </span>
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-medium text-white/45">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />{" "}
                              {recordDate(record.logDate)}
                            </span>
                            <span className="inline-flex items-center gap-1.5 sm:hidden">
                              <Clock3 className="h-3.5 w-3.5" />{" "}
                              {formatDuration(record.durationMinutes)}
                            </span>
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <strong className="hidden text-xs font-semibold tabular-nums text-white/85 sm:block">
                            {formatDuration(record.durationMinutes)}
                          </strong>
                          <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/[.08] bg-white/[.025] text-white/42 transition-[background-color,transform,color] duration-150 group-hover:bg-white/[.08] group-hover:text-white/82">
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </span>
                        </span>
                      </button>

                      {isExpanded && (
                        <div
                          id={detailId}
                          className="flex flex-col gap-2 border-t border-white/[.07] bg-black/[.1] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                        >
                          {record.notes && (
                            <p className="line-clamp-2 min-w-0 flex-1 text-[11px] leading-4 text-white/48">
                              {record.notes}
                            </p>
                          )}
                          <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEditor(record)}
                              className="signal-button h-8 gap-1.5 rounded-lg border-white/[.1] bg-white/[.025] px-2.5 text-[8px] font-bold uppercase tracking-[.12em] text-white/68 hover:border-[#72c6b3]/30 hover:bg-[#72c6b3]/[.08] hover:text-[#b8f2df]"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleting(record)}
                              className="signal-button h-8 w-8 rounded-lg text-white/32 hover:bg-[#ff8b7c]/[.08] hover:text-[#ff9a89]"
                              aria-label={`Delete ${record.activityName} record from ${recordDate(record.logDate)}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-white/[.1] bg-white/[.018] px-5 py-9 text-center">
                  <p className="text-sm font-medium text-white/66">
                    No session records match this view.
                  </p>
                  <p className="mt-2 text-xs text-white/36">
                    Try another filter or search term.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="max-w-xl rounded-3xl border-white/10 bg-[#090d14] p-7 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              Edit session record
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-white/42">
              Update the factual record only. Reflections attached to the
              session stay intact.
            </DialogDescription>
          </DialogHeader>
          <form className="mt-6 space-y-5" onSubmit={saveRecord}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="record-duration"
                  className="text-xs text-white/68"
                >
                  Duration in minutes
                </Label>
                <Input
                  id="record-duration"
                  type="number"
                  min="1"
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  className="h-11 rounded-xl border-white/[.1] bg-white/[.035] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="record-date" className="text-xs text-white/68">
                  Operational date
                </Label>
                <Input
                  id="record-date"
                  type="date"
                  max={moscowOperationalDate()}
                  value={logDate}
                  onChange={(event) => setLogDate(event.target.value)}
                  className="h-11 rounded-xl border-white/[.1] bg-white/[.035] text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="record-notes" className="text-xs text-white/68">
                Session note
              </Label>
              <Textarea
                id="record-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional factual note"
                className="min-h-28 rounded-xl border-white/[.1] bg-white/[.035] text-white placeholder:text-white/25"
              />
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
                className="h-11 rounded-xl border-white/[.1] text-[10px] font-bold uppercase tracking-[.14em] text-white/65 hover:bg-white/[.05]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateRecord.isPending}
                className="h-11 rounded-xl bg-[#72c6b3] text-[10px] font-bold uppercase tracking-[.14em] text-[#07120f] hover:bg-[#92dfc9]"
              >
                Save record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent className="rounded-3xl border-white/10 bg-[#090d14] p-7 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-[#ff9a89]">
              Delete session record?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-6 text-white/45">
              {deleting
                ? `${deleting.activityName} · ${recordDate(deleting.logDate)} · ${formatDuration(deleting.durationMinutes)} will be removed permanently.`
                : "This record will be removed permanently."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-7 gap-3">
            <AlertDialogCancel className="h-11 rounded-xl border-white/[.1] bg-white/[.035] text-[10px] font-bold uppercase tracking-[.14em] text-white/68 hover:bg-white/[.07]">
              Keep record
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteLog.isPending}
              className="h-11 rounded-xl border border-[#ff8b7c]/35 bg-[#ff8b7c]/[.12] text-[10px] font-bold uppercase tracking-[.14em] text-[#ffb0a6] hover:bg-[#ff8b7c]/[.2]"
            >
              Delete record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
