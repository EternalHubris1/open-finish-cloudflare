import { FormEvent, useMemo, useState } from "react";
import { BookOpen, Check, GraduationCap, ImagePlus, Layers3, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { completionDuration, completionKindLabel, loadCompletionRecords, saveCompletionRecords, type CompletionKind, type CompletionRecord } from "@/lib/completion-records";
import "./completion-archive-wall.css";

const kindIcon = { book: BookOpen, course: GraduationCap, block: Layers3 };
const recordDate = (value: string) => new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
const emptyForm = () => ({ kind: "book" as CompletionKind, title: "", creator: "", completedOn: new Date().toISOString().slice(0, 10), hours: "", minutes: "", mark: "印", medalImage: "", description: "" });

async function prepareMedalImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 5 * 1024 * 1024) throw new Error("The image is over 5 MB. Choose a smaller file.");
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The image could not be prepared. Choose another file.");
  const scale = Math.min(canvas.width / bitmap.width, canvas.height / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  context.drawImage(bitmap, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  bitmap.close();
  return canvas.toDataURL("image/webp", 0.82);
}

export function CompletionArchiveWall() {
  const [records, setRecords] = useState<CompletionRecord[]>(() => loadCompletionRecords());
  const [selectedId, setSelectedId] = useState<string | null>(records[0]?.id ?? null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageBusy, setImageBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const selected = useMemo(() => records.find((record) => record.id === selectedId) ?? records[0] ?? null, [records, selectedId]);

  const openNewRecord = () => {
    setEditingId(null); setForm(emptyForm()); setFormError(""); setDialogOpen(true);
  };

  const openRecordEditor = (record: CompletionRecord) => {
    setEditingId(record.id);
    setForm({
      kind: record.kind, title: record.title, creator: record.creator,
      completedOn: record.completedOn,
      hours: String(Math.floor(record.durationMinutes / 60)),
      minutes: String(record.durationMinutes % 60),
      mark: record.mark, medalImage: record.medalImage ?? "", description: record.description,
    });
    setFormError(""); setDialogOpen(true);
  };

  const addRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const record: CompletionRecord = {
      id: editingId ?? crypto.randomUUID(), kind: form.kind, title: form.title.trim(),
      creator: form.creator.trim() || "Independent work", completedOn: form.completedOn,
      durationMinutes: Math.max(0, Number(form.hours || 0) * 60 + Number(form.minutes || 0)),
      mark: form.mark.trim().slice(0, 2) || "印",
      medalImage: form.medalImage || undefined,
      description: form.description.trim() || "A completed work kept in the archive.",
    };
    const next = editingId
      ? records.map((current) => current.id === editingId ? record : current)
      : [record, ...records];
    try {
      saveCompletionRecords(next);
      setRecords(next); setSelectedId(record.id);
      setForm(emptyForm()); setEditingId(null); setFormError(""); setDialogOpen(false);
    } catch {
      setFormError("The work could not be saved in this browser. Remove the medal image or choose a smaller one, then try again.");
    }
  };

  const selectMedalImage = async (file?: File) => {
    if (!file) return;
    setImageBusy(true); setFormError("");
    try {
      const medalImage = await prepareMedalImage(file);
      setForm((current) => ({ ...current, medalImage }));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "The image could not be prepared. Choose another file.");
    } finally {
      setImageBusy(false);
    }
  };

  return <section className="completion-wall" aria-labelledby="completion-wall-title">
    <div className="completion-wall__header">
      <div><p className="completion-wall__kicker">Progress archive · finished work</p><h2 id="completion-wall-title">Completed works</h2><p>Books, courses and substantial blocks — what was finished, when, and how much time it took.</p></div>
      <Button type="button" onClick={openNewRecord} className="signal-button h-11 rounded-full bg-[#e95448] px-5 text-[10px] font-bold uppercase tracking-[.14em] text-white hover:bg-[#f26456]"><Plus className="mr-2 h-4 w-4" /> Add completed work</Button>
    </div>
    {records.length ? <div className="completion-wall__layout">
      <div className="completion-wall__records">{records.map((record) => { const Icon = kindIcon[record.kind]; return <button aria-pressed={selected?.id === record.id} className="completion-plaque" key={record.id} onClick={() => setSelectedId(record.id)} type="button">{record.medalImage ? <img className="completion-plaque__seal completion-plaque__seal--image" src={record.medalImage} alt="" /> : <span className="completion-plaque__seal" aria-hidden="true">{record.mark}</span>}<span className="completion-plaque__body"><span className="completion-plaque__kind"><Icon aria-hidden="true" className="h-3.5 w-3.5" />{completionKindLabel[record.kind]}</span><strong>{record.title}</strong><small>{record.creator}</small></span><span className="completion-plaque__date"><Check aria-hidden="true" className="h-3 w-3" />{recordDate(record.completedOn)} · {completionDuration(record.durationMinutes)}</span></button>; })}</div>
      {selected && <aside className="completion-wall__inspector" aria-live="polite">{selected.medalImage ? <img className="completion-wall__medal" src={selected.medalImage} alt={`Medal for ${selected.title}`} /> : <span aria-hidden="true">{selected.mark}</span>}<div><p>{completionKindLabel[selected.kind]} · sealed {recordDate(selected.completedOn)}</p><h3>{selected.title}</h3><small>{selected.creator}</small><blockquote>{selected.description}</blockquote><strong className="completion-wall__duration">Time invested · {completionDuration(selected.durationMinutes)}</strong><Button type="button" variant="ghost" onClick={() => openRecordEditor(selected)} className="completion-wall__edit"><Pencil className="mr-2 h-3.5 w-3.5" />Edit work</Button></div></aside>}
    </div> : <div className="completion-wall__empty"><span aria-hidden="true">印</span><h3>The archive is ready for its first finished work.</h3><p>No illustrative medals: only books, courses and blocks you actually completed.</p><Button type="button" onClick={openNewRecord} className="signal-button mt-5 rounded-full bg-[#e95448] text-white hover:bg-[#f26456]"><Plus className="mr-2 h-4 w-4" />Add first work</Button></div>}
    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setFormError(""); } }}><DialogContent className="max-w-xl rounded-3xl border-white/10 bg-[#090d14] p-7 text-white shadow-2xl"><DialogHeader><DialogTitle className="text-2xl font-bold">{editingId ? "Edit completed work" : "Register completed work"}</DialogTitle><DialogDescription className="text-white/42">{editingId ? "Refine the record or replace its medal image." : "Keep a finished book, course or meaningful block in the hall."}</DialogDescription></DialogHeader><form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={addRecord}>
      <label className="space-y-2 sm:col-span-2"><Label>What was completed</Label><Input required autoFocus value={form.title} onChange={(e) => setForm({...form,title:e.target.value})} className="border-white/10 bg-white/[.04]" placeholder="Book, course, or study block" /></label>
      <label className="space-y-2"><Label>Kind</Label><select value={form.kind} onChange={(e) => setForm({...form,kind:e.target.value as CompletionKind})} className="h-10 w-full rounded-md border border-white/10 bg-[#101722] px-3 text-sm"><option value="book">Book</option><option value="course">Course</option><option value="block">Completed block</option></select></label>
      <label className="space-y-2"><Label>Completed on</Label><Input required type="date" value={form.completedOn} onChange={(e) => setForm({...form,completedOn:e.target.value})} className="border-white/10 bg-white/[.04]" /></label>
      <label className="space-y-2 sm:col-span-2"><Label>Author / source</Label><Input value={form.creator} onChange={(e) => setForm({...form,creator:e.target.value})} className="border-white/10 bg-white/[.04]" placeholder="Author, school, or personal cycle" /></label>
      <label className="space-y-2"><Label>Hours invested</Label><Input min="0" type="number" value={form.hours} onChange={(e) => setForm({...form,hours:e.target.value})} className="border-white/10 bg-white/[.04]" /></label>
      <label className="space-y-2"><Label>Extra minutes</Label><Input min="0" max="59" type="number" value={form.minutes} onChange={(e) => setForm({...form,minutes:e.target.value})} className="border-white/10 bg-white/[.04]" /></label>
      <label className="space-y-2"><Label>Seal (1–2 signs)</Label><Input maxLength={2} value={form.mark} onChange={(e) => setForm({...form,mark:e.target.value})} className="border-white/10 bg-white/[.04]" /></label>
      <div className="space-y-2 sm:col-span-2">
        <Label>Medal image (optional)</Label>
        <div className="completion-medal-upload">
          {form.medalImage ? <img src={form.medalImage} alt="Medal preview" /> : <span aria-hidden="true"><ImagePlus className="h-5 w-5" /></span>}
          <div><strong>{form.medalImage ? "Medal ready" : "Add a custom medal"}</strong><small>PNG, JPEG or WebP · up to 5 MB. The image is prepared for the archive automatically.</small></div>
          <label className="completion-medal-upload__action"><input type="file" accept="image/png,image/jpeg,image/webp" disabled={imageBusy} onChange={(event) => { void selectMedalImage(event.target.files?.[0]); event.target.value = ""; }} /><span>{imageBusy ? "Preparing…" : form.medalImage ? "Replace" : "Choose image"}</span></label>
          {form.medalImage && <button type="button" className="completion-medal-upload__remove" onClick={() => setForm((current) => ({ ...current, medalImage: "" }))} aria-label="Remove medal image"><X className="h-4 w-4" /></button>}
        </div>
        {formError && <p className="completion-form-error" role="alert">{formError}</p>}
      </div>
      <label className="space-y-2 sm:col-span-2"><Label>What remains from it</Label><Textarea value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} className="min-h-24 border-white/10 bg-white/[.04]" /></label>
      <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="text-white/55">Cancel</Button><Button type="submit" disabled={!form.title.trim() || imageBusy} className="signal-button bg-[#e95448] text-white hover:bg-[#f26456]">{editingId ? "Save changes" : "Seal work"}</Button></div>
    </form></DialogContent></Dialog>
  </section>;
}
