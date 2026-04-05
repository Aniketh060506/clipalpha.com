import React, { useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ExpiryOption {
  label: string;
  long:  string;
  value: number;
}

export const EXPIRY_OPTIONS: ExpiryOption[] = [
  { label: "5m",  long: "5 minutes", value: 5 * 60 },
  { label: "1d",  long: "1 day",     value: 1  * 24 * 60 * 60 },
  { label: "2d",  long: "2 days",    value: 2  * 24 * 60 * 60 },
  { label: "7d",  long: "7 days",    value: 7  * 24 * 60 * 60 },
  { label: "10d", long: "10 days",   value: 10 * 24 * 60 * 60 },
  { label: "15d", long: "15 days",   value: 15 * 24 * 60 * 60 },
  { label: "30d", long: "30 days",   value: 30 * 24 * 60 * 60 },
  { label: "50d", long: "50 days",   value: 50 * 24 * 60 * 60 },
];

interface ExpiryDrumProps {
  value:    number;
  onChange: (secs: number) => void;
  disabled?: boolean;
}

export function ExpiryDrum({ value, onChange, disabled }: ExpiryDrumProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const idx = Math.max(0, EXPIRY_OPTIONS.findIndex(o => o.value === value));

  const wheelAcc   = useRef(0);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchX     = useRef<number | null>(null);
  const lastGoTime = useRef(0);

  const go = useCallback((delta: number) => {
    if (disabled) return;
    const next = Math.max(0, Math.min(EXPIRY_OPTIONS.length - 1, idx + delta));
    if (next === idx) return;
    onChange(EXPIRY_OPTIONS[next].value);
  }, [idx, disabled, onChange]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    wheelAcc.current += e.deltaX + e.deltaY;
    if (Math.abs(wheelAcc.current) >= 120) {
      const now = Date.now();
      if (now - lastGoTime.current >= 150) {
        go(wheelAcc.current > 0 ? 1 : -1);
        lastGoTime.current = now;
      }
      wheelAcc.current = 0;
    }
    if (wheelTimer.current) clearTimeout(wheelTimer.current);
    wheelTimer.current = setTimeout(() => { wheelAcc.current = 0; }, 300);
  };

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = touchX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 14) go(dx > 0 ? 1 : -1);
    touchX.current = null;
  };

  const canPrev = idx > 0;
  const canNext = idx < EXPIRY_OPTIONS.length - 1;

  // Slot config by offset from center
  const slotConfig = (off: number) => {
    const a = Math.abs(off);
    if (isMobile) {
      return {
        show:      a <= 1,
        fontSize:  a === 0 ? 14 : 11,
        fontWeight: a === 0 ? 800 : 600,
        opacity:   a === 0 ? 1 : 0.55,
        scale:     a === 0 ? 1 : 0.90,
        pillW:     a === 0 ? 38 : 30,
        pillH:     a === 0 ? 30 : 26,
        bgOpacity: a === 0 ? "bg-foreground/12 border border-border/70" : "bg-foreground/5 border border-border/30",
      };
    }
    return {
      show:      a <= 2,
      fontSize:  a === 0 ? 15 : a === 1 ? 13 : 11,
      fontWeight: a === 0 ? 800 : 600,
      opacity:   a === 0 ? 1 : a === 1 ? 0.70 : 0.40,
      scale:     a === 0 ? 1 : a === 1 ? 0.95 : 0.85,
      pillW:     a === 0 ? 52 : a === 1 ? 44 : 36,
      pillH:     a === 0 ? 34 : a === 1 ? 30 : 26,
      bgOpacity: a === 0
        ? "bg-foreground/12 border border-border/70"
        : a === 1
          ? "bg-foreground/6 border border-border/40"
          : "bg-foreground/3 border border-border/20",
    };
  };

  // Build visible slots: prev2, prev1, center, next1, next2
  const visibleOffsets = isMobile ? [-1, 0, 1] : [-2, -1, 0, 1, 2];

  return (
    <div
      className={`flex flex-col items-center gap-1 select-none ${disabled ? "opacity-40 pointer-events-none" : ""}`}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Pill row */}
      <div className="flex items-center gap-1.5 md:gap-2">

        {/* Left arrow */}
        <motion.button
          whileTap={{ scale: 0.82 }}
          onClick={() => go(-1)}
          disabled={!canPrev}
          title="Previous"
          className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg border transition-colors
            ${canPrev
              ? "border-border/60 bg-muted/50 text-foreground hover:bg-muted cursor-pointer"
              : "border-border/20 bg-transparent text-muted-foreground/20 cursor-not-allowed"}`}
        >
          <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </motion.button>

        {/* Pills */}
        <div className="flex items-center gap-1 md:gap-1.5">
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleOffsets.map(off => {
              const ri = idx + off;
              if (ri < 0 || ri >= EXPIRY_OPTIONS.length) {
                // placeholder to keep layout stable
                return (
                  <div
                    key={`empty-${off}`}
                    style={{ width: slotConfig(off).pillW, height: slotConfig(off).pillH, opacity: 0 }}
                  />
                );
              }
              const opt = EXPIRY_OPTIONS[ri];
              const cfg = slotConfig(off);
              return (
                <motion.button
                  key={`${opt.value}`}
                  onClick={() => off !== 0 && go(off)}
                  title={opt.long}
                  animate={{ opacity: cfg.opacity, scale: cfg.scale }}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className={`rounded-xl md:rounded-2xl flex items-center justify-center font-heading transition-colors
                    ${off === 0 ? "cursor-default" : "cursor-pointer hover:bg-foreground/10"}
                    ${cfg.bgOpacity}`}
                  style={{
                    width:      cfg.pillW,
                    height:     cfg.pillH,
                    fontSize:   cfg.fontSize,
                    fontWeight: cfg.fontWeight,
                    letterSpacing: off === 0 ? "-0.03em" : "-0.01em",
                    lineHeight: 1,
                  }}
                >
                  {opt.label}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Right arrow */}
        <motion.button
          whileTap={{ scale: 0.82 }}
          onClick={() => go(1)}
          disabled={!canNext}
          title="Next"
          className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg border transition-colors
            ${canNext
              ? "border-border/60 bg-muted/50 text-foreground hover:bg-muted cursor-pointer"
              : "border-border/20 bg-transparent text-muted-foreground/20 cursor-not-allowed"}`}
        >
          <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </motion.button>

      </div>

      {/* Long label */}
      <span className="text-[9px] font-body font-bold text-muted-foreground/60 uppercase tracking-[0.12em]">
        {EXPIRY_OPTIONS[idx]?.long ?? ""}
      </span>

    </div>
  );
}

