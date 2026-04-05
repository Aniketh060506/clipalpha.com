import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Globe, AlertCircle } from "lucide-react";
import { checkSlug } from "../../utils/api";

interface SlugPickerProps {
  slug: string;
  onSlugChange: (slug: string) => void;
  onValidityChange: (valid: boolean) => void;
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

function slugify(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-{2,}/g, "-").slice(0, 60);
}

export default function SlugPicker({ slug, onSlugChange, onValidityChange }: SlugPickerProps) {
  const [status, setStatus] = useState<SlugStatus>("idle");
  const [displaySlug, setDisplaySlug] = useState(slug);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!displaySlug || displaySlug.length < 2) {
      setStatus("invalid");
      onValidityChange(false);
      return;
    }

    setStatus("checking");
    onValidityChange(false);

    debounceRef.current = setTimeout(async () => {
      try {
        const { available } = await checkSlug(displaySlug);
        setStatus(available ? "available" : "taken");
        onValidityChange(available);
      } catch {
        setStatus("idle");
        onValidityChange(true); // assume available on error
      }
    }, 600);
  }, [displaySlug]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const clean = slugify(e.target.value);
    setDisplaySlug(clean);
    onSlugChange(clean);
  }

  const statusConfig: Record<SlugStatus, { icon: React.ElementType; color: string; message: string }> = {
    idle: { icon: Globe, color: "text-muted-foreground", message: "" },
    checking: { icon: Loader2, color: "text-muted-foreground", message: "Checking…" },
    available: { icon: Check, color: "text-emerald-600", message: "Available!" },
    taken: { icon: X, color: "text-accent", message: "Already taken" },
    invalid: { icon: AlertCircle, color: "text-amber-500", message: "Min 2 characters" },
  };

  const { icon: StatusIcon, color, message } = statusConfig[status];

  return (
    <div>
      <div className="relative">
        {/* Base URL prefix */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm font-body text-muted-foreground select-none">
          <Globe className="w-3.5 h-3.5" />
          <span>clipalpha.com/</span>
        </div>
        <input
          type="text"
          value={displaySlug}
          onChange={handleChange}
          placeholder="my-secret"
          className="w-full bg-background/80 border border-border rounded-2xl pl-[148px] pr-10 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
        />
        {/* Status icon */}
        <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${color}`}>
          <motion.div
            key={status}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            <StatusIcon
              className={`w-4 h-4 ${status === "checking" ? "animate-spin" : ""}`}
            />
          </motion.div>
        </div>
      </div>

      {/* Status message */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.p
            key={status}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-xs font-body mt-1.5 flex items-center gap-1 ${color}`}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Border color animation */}
      <AnimatePresence>
        {status === "available" && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            className="h-0.5 bg-gradient-to-r from-emerald-400 to-primary rounded-full mt-1 origin-left"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
