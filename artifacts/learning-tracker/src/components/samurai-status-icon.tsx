import focusMotion from "@assets/samurai-status-icons/status-seated-sword.gif";
import focusStatic from "@assets/samurai-status-icons/status-seated_sword.png";
import activeMotion from "@assets/samurai-status-icons/status-slash.gif";
import activeStatic from "@assets/samurai-status-icons/status-slash.png";
import standingMotion from "@assets/samurai-status-icons/status-standing-prayer.gif";
import standingStatic from "@assets/samurai-status-icons/status-standing_prayer.png";
import pauseMotion from "@assets/samurai-status-icons/status-tea-pause.gif";
import pauseStatic from "@assets/samurai-status-icons/status-tea_pause.png";

export type SamuraiStatus = "focus" | "active" | "standing" | "pause";

type SamuraiStatusIconProps = {
  status: SamuraiStatus;
  label: string;
  className?: string;
  animate?: boolean;
};

const statusAssets: Record<SamuraiStatus, { motion: string; static: string }> =
  {
    focus: { motion: focusMotion, static: focusStatic },
    active: { motion: activeMotion, static: activeStatic },
    standing: { motion: standingMotion, static: standingStatic },
    pause: { motion: pauseMotion, static: pauseStatic },
  };

export function SamuraiStatusIcon({
  status,
  label,
  className = "h-10 w-10",
  animate = true,
}: SamuraiStatusIconProps) {
  const asset = statusAssets[status];

  return (
    <span
      className={`samurai-status-icon ${className}`}
      role="img"
      aria-label={label}
    >
      {animate ? (
        <img
          src={asset.motion}
          alt=""
          aria-hidden="true"
          className="samurai-status-motion h-full w-full object-contain"
        />
      ) : null}
      <img
        src={asset.static}
        alt=""
        aria-hidden="true"
        className={`samurai-status-static h-full w-full object-contain ${animate ? "" : "samurai-status-static-only"}`}
      />
    </span>
  );
}
