import React, { useEffect, useState } from "react";

interface CountdownTimerProps {
  expiresAt: string;
  compact?: boolean;
}

function getTimeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, totalMs: diff };
}

export default function CountdownTimer({ expiresAt, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(expiresAt));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!timeLeft) return compact ? <span>Expired</span> : <span className="text-accent font-body text-sm font-semibold">Expired</span>;

  if (compact) {
    if (timeLeft.d > 0) return <span>Expires in {timeLeft.d}d {timeLeft.h}h</span>;
    if (timeLeft.h > 0) return <span>Expires in {timeLeft.h}h {timeLeft.m}m</span>;
    return <span>Expires in {timeLeft.m}m {timeLeft.s}s</span>;
  }

  // Full display: segmented countdown blocks
  const urgency = timeLeft.totalMs < 5 * 60 * 1000; // < 5 minutes
  const color = urgency ? "text-accent" : "text-primary";

  const blocks = timeLeft.d > 0
    ? [{ label: "Days", val: timeLeft.d }, { label: "Hours", val: timeLeft.h }, { label: "Mins", val: timeLeft.m }, { label: "Secs", val: timeLeft.s }]
    : timeLeft.h > 0
    ? [{ label: "Hours", val: timeLeft.h }, { label: "Mins", val: timeLeft.m }, { label: "Secs", val: timeLeft.s }]
    : [{ label: "Mins", val: timeLeft.m }, { label: "Secs", val: timeLeft.s }];

  return (
    <div className="flex items-center gap-3 justify-center">
      {blocks.map(({ label, val }, i) => (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center">
            <span className={`font-heading text-4xl font-bold tabular-nums ${color}`}>
              {String(val).padStart(2, "0")}
            </span>
            <span className="text-xs font-body text-muted-foreground uppercase tracking-widest mt-0.5">{label}</span>
          </div>
          {i < blocks.length - 1 && (
            <span className={`font-heading text-3xl font-bold ${color} opacity-40 mb-3`}>:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
