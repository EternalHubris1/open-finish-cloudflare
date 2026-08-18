# Open Finish roadmap

Status: product direction, not a release promise

## Now — continuity core

- Optional session reflection and continuation.
- Focused Dashboard and unselected Continue chooser.
- Minimal Today Context with one external HTTP(S) context link.
- Durable Evidence Shelf and one Weekly Reflection per week.
- Additive, data-preserving database migrations.

## Later — permissioned external context

### Google Drive

- Let a person connect Google Drive explicitly.
- Read a linked document as optional context when the person grants access.
- Show source, access state, and last successful read clearly.
- Do not import document content silently or imply synchronization when access is unavailable.

### Vikunja

- Investigate opening a linked project or item as agent-readable context through an explicit connection.
- Start read-only; task creation, status changes, and two-way synchronization require a separate approval.
- Keep task-management mechanics outside the core Open Finish experience.

### Obsidian and connected notes

- Connect a vault only with explicit permission and a clearly visible source boundary.
- Use actual Obsidian links, tags, and note metadata as the basis for relationships between reflections and directions.
- Start with read-only context and deep links back to the source note.
- Revisit Inquiry Threads only if they add a useful layer above existing Obsidian notes.
- Revisit a visual constellation only when its edges can show real provenance rather than inferred similarity alone.

## Not scheduled

- OAuth implementation and connector selection.
- Background synchronization.
- Importing external tasks into Today Context.
- Writing changes back to Google Drive or Vikunja.
- Writing to an Obsidian vault or silently indexing its full contents.

These items move into delivery only after a separate privacy, permission, failure-state, and product-boundary review.
