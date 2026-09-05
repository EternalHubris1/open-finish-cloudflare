import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, Plus } from "lucide-react";
import {
  COMPLETION_RECORDS_CHANGED,
  completionDuration,
  completionKindLabel,
  loadCompletionRecords,
  type CompletionRecord,
} from "@/lib/completion-records";

function completionDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}

export function CompletionShowcase({ light = false }: { light?: boolean }) {
  const [completionRecords, setCompletionRecords] = useState<CompletionRecord[]>(
    () => loadCompletionRecords(),
  );
  useEffect(() => {
    const refresh = () => setCompletionRecords(loadCompletionRecords());
    window.addEventListener(COMPLETION_RECORDS_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(COMPLETION_RECORDS_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const recentRecords = [...completionRecords]
    .sort((left, right) => right.completedOn.localeCompare(left.completedOn))
    .slice(0, 4);
  return (
    <section
      className={`relative isolate overflow-hidden rounded-[1.6rem] border p-4 sm:p-5 ${light ? "border-black/10 bg-white/45" : "border-white/[.08] bg-[#0c1119]/82"}`}
      aria-labelledby="completion-showcase-title"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p
            className={`text-[8px] font-bold uppercase tracking-[.2em] ${light ? "text-[#8a302b]" : "text-[#ff9a89]"}`}
          >
            Sealed along the path
          </p>
          <h2
            id="completion-showcase-title"
            className={`mt-1 text-lg font-semibold ${light ? "text-[#181719]" : "text-white"}`}
          >
            Recent completions
          </h2>
        </div>
        <Link
          href="/achievements"
          className={`flex items-center gap-1 text-[8px] font-bold uppercase tracking-[.14em] ${light ? "text-black/45" : "text-white/40"}`}
        >
          Open progress <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {recentRecords.length ? (
        <div className="mt-4 grid gap-2 lg:grid-cols-2">
          {recentRecords.map((record) => (
            <Link
              key={record.id}
              href="/achievements"
              className={`group flex min-w-0 items-center gap-3 rounded-xl border p-3 transition-[border-color,background-color,transform] duration-150 active:scale-[.99] ${light ? "border-black/[.07] bg-black/[.025] hover:border-[#8a302b]/20 hover:bg-white/55" : "border-white/[.06] bg-white/[.025] hover:border-[#ff9a89]/22 hover:bg-white/[.045]"}`}
              aria-label={`Open ${record.title} in Progress`}
            >
              <span
                className={`relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border font-serif text-xl shadow-[inset_0_0_0_3px_rgba(255,255,255,.035)] ${light ? "border-black/15 bg-white/60 text-[#8a302b]" : "border-[#ff9a89]/25 bg-[#e95448]/10 text-[#ffb1a7]"}`}
              >
                {record.medalImage ? (
                  <img
                    src={record.medalImage}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover"
                    style={{ transform: `scale(${(record.medalScale ?? 100) / 100})` }}
                  />
                ) : (
                  record.mark
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-sm font-semibold ${light ? "text-[#181719]" : "text-white/88"}`}>
                  {record.title}
                </span>
                <span className={`mt-1 block font-mono text-[8px] font-bold uppercase tracking-[.12em] ${light ? "text-black/42" : "text-white/38"}`}>
                  {completionKindLabel[record.kind]} · {completionDate(record.completedOn)} · {completionDuration(record.durationMinutes)}
                </span>
                {record.description && (
                  <span className={`mt-1.5 line-clamp-2 block text-[10px] leading-4 ${light ? "text-black/48" : "text-white/46"}`}>
                    {record.description}
                  </span>
                )}
              </span>
              <ArrowUpRight className={`h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${light ? "text-black/25" : "text-white/22"}`} />
            </Link>
          ))}
        </div>
      ) : (
        <Link
          href="/achievements"
          className={`mt-4 flex min-h-20 items-center justify-center gap-2 rounded-xl border border-dashed text-[9px] font-bold uppercase tracking-[.12em] ${light ? "border-black/10 text-black/36" : "border-white/[.08] text-white/32"}`}
        >
          <Plus className="h-4 w-4" /> Register the first completed work
        </Link>
      )}
    </section>
  );
}
