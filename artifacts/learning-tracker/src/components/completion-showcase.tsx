import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, Plus } from "lucide-react";
import {
  COMPLETION_RECORDS_CHANGED,
  completionKindLabel,
  loadCompletionRecords,
  type CompletionRecord,
} from "@/lib/completion-records";

export function CompletionShowcase({ light = false }: { light?: boolean }) {
  const [completionRecords, setCompletionRecords] = useState<CompletionRecord[]>(
    () => loadCompletionRecords(),
  );
  useEffect(() => {
    const refresh = () => setCompletionRecords(loadCompletionRecords());
    window.addEventListener(COMPLETION_RECORDS_CHANGED, refresh);
    return () => window.removeEventListener(COMPLETION_RECORDS_CHANGED, refresh);
  }, []);
  const groups = (["block", "course", "book"] as const).map((kind) => ({
    kind,
    records: completionRecords.filter((record) => record.kind === kind).slice(0, 4),
  }));
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
          Open hall <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {groups.map((group) => (
          <div
            key={group.kind}
            className={`rounded-xl border px-3 py-3 ${light ? "border-black/[.07] bg-black/[.025]" : "border-white/[.06] bg-white/[.025]"}`}
          >
            <p
              className={`text-[7px] font-bold uppercase tracking-[.16em] ${light ? "text-black/38" : "text-white/32"}`}
            >
              {completionKindLabel[group.kind]}
            </p>
            <div className="mt-2 flex min-h-10 gap-2">
              {group.records.length ? group.records.map((record) => (
                <span
                  key={record.id}
                  title={`${record.title}: ${record.description}`}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-[#ff9a89]/20 bg-[#e95448]/10 font-serif text-lg text-[#ffb1a7]"
                >
                  {record.mark}
                </span>
              )) : (
                <Link href="/achievements" className={`flex items-center gap-1 text-[8px] font-bold uppercase tracking-[.12em] ${light ? "text-black/32" : "text-white/28"}`}>
                  <Plus className="h-3.5 w-3.5" /> Add first
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
