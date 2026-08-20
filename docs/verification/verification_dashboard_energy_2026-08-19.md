# Dashboard energy layout verification

Verified on the published Worker URL after commit `8c6920c`.

- The Dashboard loads successfully with live Neon data.
- The Energy invested block is directly below the hero panel.
- The visible copy describes a thin vertical sport mark beneath each day.
- The sports legend now reads only `Sport`; the repeated `separate` label is absent from the visible graph legend.
- Today’s context is rendered in the right-hand column of the Energy invested block, with editable intention, direction, context link, save action, and context link action.
- The visual screenshot confirms the two-column Energy invested layout on desktop: graph on the left and compact Today’s context on the right.
- No data mutation was performed during verification.

Note: an earlier `curl` timed out briefly during Cloudflare deployment propagation, but browser verification after propagation succeeded.
