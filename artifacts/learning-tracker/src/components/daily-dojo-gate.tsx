import { useEffect, useState } from "react";
import { DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVisualEffects } from "@/components/visual-effects-provider";

const DAILY_DOJO_GATE_STORAGE_KEY = "open-finish:daily-dojo-gate";
const MOSCOW_TIME_ZONE = "Europe/Moscow";

function currentDojōDay() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MOSCOW_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function DailyDojoGate() {
  const [open, setOpen] = useState<boolean | null>(null);
  const { enabled: visualEffectsEnabled } = useVisualEffects();

  useEffect(() => {
    const today = currentDojōDay();
    try {
      setOpen(
        window.localStorage.getItem(DAILY_DOJO_GATE_STORAGE_KEY) !== today,
      );
    } catch {
      setOpen(true);
    }
  }, []);

  const enterDojō = () => {
    try {
      window.localStorage.setItem(
        DAILY_DOJO_GATE_STORAGE_KEY,
        currentDojōDay(),
      );
    } catch {
      // The gate still closes for the current visit when storage is unavailable.
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <section
      aria-labelledby="daily-dojo-gate-title"
      className={`daily-dojo-gate ${visualEffectsEnabled ? "" : "daily-dojo-gate-muted"}`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="daily-dojo-gate-panel daily-dojo-gate-panel-left"
        aria-hidden="true"
      />
      <div
        className="daily-dojo-gate-panel daily-dojo-gate-panel-right"
        aria-hidden="true"
      />
      <div className="daily-dojo-gate-content">
        <div className="daily-dojo-gate-emblem" aria-hidden="true">
          道場
        </div>
        <p className="text-[9px] font-bold uppercase tracking-[.28em] text-[#ffb1a7]">
          Eternal Dodjo
        </p>
        <h1
          id="daily-dojo-gate-title"
          className="mt-4 text-3xl font-semibold tracking-[-.04em] text-white md:text-4xl"
        >
          The gates open.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-white/58">
          Return to one honest line. Nothing else is owed.
        </p>
        <Button
          autoFocus
          className="of-button mt-7 h-11 rounded-full border border-[#ff8b7c]/25 bg-[#e95448] px-5 text-[10px] font-bold uppercase tracking-[.16em] text-white shadow-[0_14px_34px_rgba(233,84,72,.2)] hover:bg-[#f26456]"
          onClick={enterDojō}
          type="button"
        >
          <DoorOpen className="mr-2 h-4 w-4" /> Enter the Dōjō
        </Button>
      </div>
    </section>
  );
}
