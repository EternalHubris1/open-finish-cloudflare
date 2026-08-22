type DojoScenePanelProps = {
  image: string;
  eyebrow: string;
  context: string;
  className?: string;
};

/**
 * A contained room inside a page. The scene is intentionally visual-first:
 * it gives a route a spatial identity without duplicating the page's content.
 */
export function DojoScenePanel({
  image,
  eyebrow,
  context,
  className = "",
}: DojoScenePanelProps) {
  return (
    <section
      className={`relative isolate min-h-44 overflow-hidden rounded-[1.65rem] border border-white/[.09] bg-[#0a1019]/94 shadow-[0_20px_54px_rgba(0,0,0,.2)] ${className}`}
      aria-label={eyebrow}
    >
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center opacity-[.78]"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(7,12,19,.78)_0%,rgba(7,12,19,.28)_46%,rgba(7,12,19,.12)_100%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-5 right-4 w-px bg-[linear-gradient(180deg,transparent,rgba(255,194,104,.42),transparent)] sm:right-6"
        aria-hidden="true"
      />
      <div className="absolute bottom-5 left-5 z-10 sm:bottom-6 sm:left-7">
        <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.22em] text-[#fff1d5]/86">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff7a68] shadow-[0_0_12px_rgba(255,122,104,.8)]" />
          {eyebrow}
        </p>
        <p className="mt-2 text-[9px] font-bold uppercase tracking-[.18em] text-white/48">
          {context}
        </p>
      </div>
    </section>
  );
}

export default DojoScenePanel;
