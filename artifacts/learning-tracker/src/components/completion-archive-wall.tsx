import { FormEvent, useMemo, useState } from "react";
import { BookOpen, Check, GraduationCap, Layers3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { completionDuration, completionKindLabel, loadCompletionRecords, saveCompletionRecords, type CompletionKind, type CompletionRecord } from "@/lib/completion-records";
import "./completion-archive-wall.css";

const kindIcon = { book: BookOpen, course: GraduationCap, block: Layers3 };
const recordDate = (value: string) => new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
const emptyForm = () => ({ kind: "book" as CompletionKind, title: "", creator: "", completedOn: new Date().toISOString().slice(0, 10), hours: "", minutes: "", mark: "印", description: "" });

export function CompletionArchiveWall() {
  const [records, setRecords] = useState<CompletionRecord[]>(() => loadCompletionRecords());
  const [selectedId, setSelectedId] = useState<string | null>(records[0]?.id ?? null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const selected = useMemo(() => records.find((record) => record.id === selectedId) ?? records[0] ?? null, [records, selectedId]);

  const addRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const record: CompletionRecord = {
      id: crypto.randomUUID(), kind: form.kind, title: form.title.trim(),
      creator: form.creator.trim() || "Independent work", completedOn: form.completedOn,
      durationMinutes: Math.max(0, Number(form.hours || 0) * 60 + Number(form.minutes || 0)),
      mark: form.mark.trim().slice(0, 2) || "印",
      description: form.description.trim() || "A completed work kept in the archive.",
    };
    const next = [record, ...records];
    setRecords(next); setSelectedId(record.id); saveCompletionRecords(next);
    setForm(emptyForm()); setDialogOpen(false);
  };

  return <section className="completion-wall" aria-labelledby="completion-wall-title">
    <div className="completion-wall__header">
      <div><p className="completion-wall__kicker">Progress archive · finished work</p><h2 id="completion-wall-title">Completed works</h2><p>Books, courses and substantial blocks — what was finished, when, and how much time it took.</p></div>
      <Button type="button" onClick={() => setDialogOpen(true)} className="signal-button h-11 rounded-full bg-[#e95448] px-5 text-[10px] font-bold uppercase tracking-[.14em] text-white hover:bg-[#f26456]"><Plus className="mr-2 h-4 w-4" /> Add completed work</Button>
    </div>
    {records.length ? <div className="completion-wall__layout">
      <div className="completion-wall__records">{records.map((record) => { const Icon = kindIcon[record.kind]; return <button aria-pressed={selected?.id === record.id} className="completion-plaque" key={record.id} onClick={() => setSelectedId(record.id)} type="button"><span className="completion-plaque__seal" aria-hidden="true">{record.mark}</span><span className="completion-plaque__body"><span className="completion-plaque__kind"><Icon aria-hidden="true" className="h-3.5 w-3.5" />{completionKindLabel[record.kind]}</span><strong>{record.title}</strong><small>{record.creator}</small></span><span className="completion-plaque__date"><Check aria-hidden="true" className="h-3 w-3" />{recordDate(record.completedOn)} · {completionDuration(record.durationMinutes)}</span></button>; })}</div>
      {selected && <aside className="completion-wall__inspector" aria-live="polite"><span aria-hidden="true">{selected.mark}</span><div><p>{completionKindLabel[selected.kind]} · sealed {recordDate(selected.completedOn)}</p><h3>{selected.title}</h3><small>{selected.creator}</small><blockquote>{selected.description}</blockquote><strong className="completion-wall__duration">Time invested · {completionDuration(selected.durationMinutes)}</strong></div></aside>}
    </div> : <div className="completion-wall__empty"><span aria-hidden="true">印</span><h3>The archive is ready for its first finished work.</h3><p>No illustrative medals: only books, courses and blocks you actually completed.</p><Button type="button" onClick={() => setDialogOpen(true)} className="signal-button mt-5 rounded-full bg-[#e95448] text-white hover:bg-[#f26456]"><Plus className="mr-2 h-4 w-4" />Add first work</Button></div>}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-xl rounded-3xl border-white/10 bg-[#090d14] p-7 text-white shadow-2xl"><DialogHeader><DialogTitle className="text-2xl font-bold">Register completed work</DialogTitle><DialogDescription className="text-white/42">Keep a finished book, course or meaningful block in the hall.</DialogDescription></DialogHeader><form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={addRecord}>
      <label className="space-y-2 sm:col-span-2"><Label>What was completed</Label><Input required autoFocus value={form.title} onChange={(e) => setForm({...form,title:e.target.value})} className="border-white/10 bg-white/[.04]" placeholder="Book, course, or study block" /></label>
      <label className="space-y-2"><Label>Kind</Label><select value={form.kind} onChange={(e) => setForm({...form,kind:e.target.value as CompletionKind})} className="h-10 w-full rounded-md border border-white/10 bg-[#101722] px-3 text-sm"><option value="book">Book</option><option value="course">Course</option><option value="block">Completed block</option></select></label>
      <label className="space-y-2"><Label>Completed on</Label><Input required type="date" value={form.completedOn} onChange={(e) => setForm({...form,completedOn:e.target.value})} className="border-white/10 bg-white/[.04]" /></label>
      <label className="space-y-2 sm:col-span-2"><Label>Author / source</Label><Input value={form.creator} onChange={(e) => setForm({...form,creator:e.target.value})} className="border-white/10 bg-white/[.04]" placeholder="Author, school, or personal cycle" /></label>
      <label className="space-y-2"><Label>Hours invested</Label><Input min="0" type="number" value={form.hours} onChange={(e) => setForm({...form,hours:e.target.value})} className="border-white/10 bg-white/[.04]" /></label>
      <label className="space-y-2"><Label>Extra minutes</Label><Input min="0" max="59" type="number" value={form.minutes} onChange={(e) => setForm({...form,minutes:e.target.value})} className="border-white/10 bg-white/[.04]" /></label>
      <label className="space-y-2"><Label>Seal (1–2 signs)</Label><Input maxLength={2} value={form.mark} onChange={(e) => setForm({...form,mark:e.target.value})} className="border-white/10 bg-white/[.04]" /></label>
      <label className="space-y-2 sm:col-span-2"><Label>What remains from it</Label><Textarea value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} className="min-h-24 border-white/10 bg-white/[.04]" /></label>
      <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="text-white/55">Cancel</Button><Button type="submit" disabled={!form.title.trim()} className="signal-button bg-[#e95448] text-white hover:bg-[#f26456]">Seal work</Button></div>
    </form></DialogContent></Dialog>
  </section>;
}
