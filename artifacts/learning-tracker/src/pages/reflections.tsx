import { useMemo, useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpenText,
  Filter,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  getListActivitiesQueryKey,
  getListReflectionsQueryKey,
  useListActivities,
  useListReflections,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function includesQuery(
  entry: {
    activityName: string;
    recallNote?: string | null;
    whatMoved?: string | null;
    whatLearned?: string | null;
    nextContinuation?: string | null;
  },
  query: string,
) {
  if (!query.trim()) return true;
  const haystack = [
    entry.activityName,
    entry.recallNote,
    entry.whatMoved,
    entry.whatLearned,
    entry.nextContinuation,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

export default function Reflections() {
  const reflectionsQuery = useListReflections({
    query: { queryKey: getListReflectionsQueryKey() },
  });
  const activitiesQuery = useListActivities({
    query: { queryKey: getListActivitiesQueryKey() },
  });
  const [query, setQuery] = useState("");
  const [activityId, setActivityId] = useState<number | null>(null);

  const reflections = Array.isArray(reflectionsQuery.data)
    ? reflectionsQuery.data
    : [];
  const activities = Array.isArray(activitiesQuery.data)
    ? activitiesQuery.data
    : [];
  const filtered = useMemo(
    () =>
      reflections.filter(
        (entry) =>
          (activityId === null || entry.activityId === activityId) &&
          includesQuery(entry, query),
      ),
    [activityId, query, reflections],
  );
  const hasFilters = Boolean(query.trim()) || activityId !== null;
  const retrying = reflectionsQuery.isFetching || activitiesQuery.isFetching;

  if (reflectionsQuery.isLoading || activitiesQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5 p-6 md:p-10">
        <Skeleton className="h-36 rounded-[2rem] bg-white/5" />
        <Skeleton className="h-56 rounded-[2rem] bg-white/5" />
      </div>
    );
  }

  if (reflectionsQuery.isError || activitiesQuery.isError) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-3xl items-center p-5 md:p-10">
        <section
          className="signal-surface w-full rounded-[2rem] border border-[#ff8b7c]/20 bg-[#0c1119]/92 p-8 text-center"
          role="alert"
        >
          <AlertTriangle className="mx-auto h-9 w-9 text-[#ff9a89]" />
          <h1 className="mt-5 text-2xl font-semibold text-white">
            Session notes could not be loaded
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-white/50">
            Your saved work has not changed. Check the connection and try again.
          </p>
          <Button
            type="button"
            onClick={() => {
              void reflectionsQuery.refetch();
              void activitiesQuery.refetch();
            }}
            disabled={retrying}
            className="mt-6 rounded-full bg-[#e95448] px-6 text-[10px] font-bold uppercase tracking-[.14em] text-white hover:bg-[#f26456]"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${retrying ? "animate-spin" : ""}`}
            />
            Try again
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl space-y-6 p-5 pb-28 md:p-10">
      <header className="signal-surface relative overflow-hidden rounded-[2rem] border border-white/[.08] bg-[#0c1119]/92 p-7 md:p-9">
        <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-[#ff7868] blur-3xl opacity-[.07]" />
        <div className="relative max-w-2xl">
          <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.24em] text-[#ff9a89]">
            <BookOpenText className="h-3.5 w-3.5" /> Session notes
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-.04em] text-white md:text-4xl">
            A light trail back into the work.
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/50">
            Optional notes from finished sessions. Use them only when a detail,
            learning, or next step will make returning easier.
          </p>
        </div>
      </header>

      <section
        className="signal-surface rounded-[2rem] border border-white/[.08] bg-[#0c1119]/92 p-5 md:p-6"
        aria-labelledby="session-note-filters"
      >
        <h2 id="session-note-filters" className="sr-only">
          Find session notes
        </h2>
        <div className="grid gap-3 md:grid-cols-[1fr_14rem]">
          <label className="relative">
            <span className="sr-only">Search session notes</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a note or next step"
              className="h-12 rounded-2xl border-white/10 bg-white/[.035] pl-11 text-white placeholder:text-white/25"
            />
          </label>
          <label className="relative">
            <span className="sr-only">Filter by direction</span>
            <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <select
              value={activityId ?? ""}
              onChange={(event) =>
                setActivityId(
                  event.target.value ? Number(event.target.value) : null,
                )
              }
              className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-white/[.035] px-11 text-sm text-white outline-none focus:ring-2 focus:ring-[#ff7868]"
            >
              <option className="bg-white text-black" value="">
                All directions
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
          </label>
        </div>
        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-white/40"
          aria-live="polite"
        >
          <span>
            {filtered.length} {filtered.length === 1 ? "note" : "notes"}
            {hasFilters
              ? " match your view."
              : " kept from completed sessions."}
          </span>
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setActivityId(null);
              }}
              className="h-auto rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-white/50 hover:bg-white/[.06] hover:text-white"
            >
              Clear filters
            </Button>
          )}
        </div>
      </section>

      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <article
              key={entry.id}
              className="signal-surface rounded-[1.6rem] border border-white/[.08] bg-[#0c1119]/92 p-5 md:p-6"
            >
              <div className="flex flex-col gap-4 border-b border-white/8 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.activityColor }}
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/activities/${entry.activityId}`}
                      className="font-semibold text-white hover:text-[#ff9a89]"
                    >
                      {entry.activityName}
                    </Link>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[.15em] text-white/35">
                      {format(
                        new Date(`${entry.logDate}T00:00:00`),
                        "MMMM d, yyyy",
                      )}{" "}
                      · {entry.durationMinutes} min
                    </p>
                  </div>
                </div>
                <Link
                  href={`/history?date=${entry.logDate}&from=reflection`}
                  className="inline-flex shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-white/40 hover:text-white"
                >
                  Open day <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <dl className="mt-4 grid gap-4 md:grid-cols-2">
                {entry.whatMoved && (
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-white/35">
                      What moved
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-white/70">
                      {entry.whatMoved}
                    </dd>
                  </div>
                )}
                {entry.whatLearned && (
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-white/35">
                      What became clearer
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-white/70">
                      {entry.whatLearned}
                    </dd>
                  </div>
                )}
                {entry.nextContinuation && (
                  <div className="rounded-2xl border border-[#ff8b7c]/15 bg-[#ff7868]/[.055] p-4 md:col-span-2">
                    <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-[#ff9a89]">
                      Next step
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-white/75">
                      {entry.nextContinuation}
                    </dd>
                  </div>
                )}
                {entry.recallNote && (
                  <div className="md:col-span-2">
                    <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-white/35">
                      Recall note
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-white/60">
                      {entry.recallNote}
                    </dd>
                  </div>
                )}
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <section className="signal-surface rounded-[2rem] border border-dashed border-white/15 bg-[#0c1119]/80 p-12 text-center">
          <BookOpenText className="mx-auto h-9 w-9 text-white/20" />
          <h2 className="mt-4 text-xl font-semibold text-white">
            {hasFilters ? "No notes match this view" : "No session notes yet"}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">
            {hasFilters
              ? "Try clearing the search or direction filter."
              : "After a session, leave a short note only when it will make the next return lighter."}
          </p>
          {!hasFilters && (
            <Link
              href="/"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-[#e95448] px-5 text-[10px] font-bold uppercase tracking-[.14em] text-white transition-colors hover:bg-[#f26456]"
            >
              Open dashboard <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
