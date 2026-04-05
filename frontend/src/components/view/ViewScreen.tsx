import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Eye, EyeOff, Shield, AlertTriangle, Fingerprint, Loader2, Home } from "lucide-react";
import { unlockClip } from "../../utils/api";
import { decryptText } from "../../utils/crypto";
import { hashPassword } from "../../utils/crypto";
import PasswordCard from "./PasswordCard";
import CountdownTimer from "./CountdownTimer";
import { useNavigate } from "react-router-dom";

interface ClipMeta {
  slug: string;
  hasPassword: boolean;
  expiresAt: string | null;
  burnAfterRead: boolean;
  viewsRemaining: number | null;
  contentType: "text" | "file" | "multipart";
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  viewCount?: number;
  viewLimit?: number;
}

interface ViewScreenProps {
  meta: ClipMeta;
}

export default function ViewScreen({ meta }: ViewScreenProps) {
  const navigate = useNavigate();
  // For clips with no password + no burn: start decrypting immediately, skip the lock card entirely
  const autoUnlock = !meta.hasPassword && !meta.burnAfterRead;
  const [phase, setPhase] = useState<"lock" | "decrypting" | "revealed" | "burned" | "expired" | "server-locked">(autoUnlock ? "decrypting" : "lock");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [decryptedContent, setDecryptedContent] = useState("");
  const [encryptedBlob, setEncryptedBlob] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxAttempts = 5;

  useEffect(() => {
    if (meta.expiresAt && new Date(meta.expiresAt) < new Date()) {
      setPhase("expired");
    }
  }, [meta.expiresAt]);

  // Auto-unlock on mount for no-password no-burn clips
  useEffect(() => {
    if (autoUnlock) {
      handleUnlock();
    }
  }, []);

  async function handleUnlock() {
    if (meta.hasPassword && !password.trim()) { setError("Please enter the password."); return; }
    setPhase("decrypting");
    setError("");
    try {
      const pwHash = meta.hasPassword ? await hashPassword(password) : null;
      const data = await unlockClip(meta.slug, pwHash);
      setEncryptedBlob(data.ciphertext);
      
      const pwToUse = meta.hasPassword ? password : "pastit-default-no-password";
      
      // Client-side decrypt only for text
      let plain = "";
      if (meta.contentType === "text") {
        plain = await decryptText(data.ciphertext, pwToUse);
      } else if (meta.contentType === "multipart") {
        const parsed = JSON.parse(data.ciphertext);
        if (parsed.text) {
          parsed.text = await decryptText(parsed.text, pwToUse);
        }
        plain = JSON.stringify(parsed);
      } else {
        plain = data.ciphertext; // Raw base64 dataUrl string unencrypted
      }
      setDecryptedContent(plain);
      if (meta.burnAfterRead) {
        setPhase("burned");
        setTimeout(() => setPhase("revealed"), 2000);
      } else {
        setPhase("revealed");
      }
    } catch (err: any) {
      if (err?.status === 423) {
        setPhase("server-locked");
        return;
      }
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= maxAttempts) {
        setError("Too many failed attempts. This clip has been cryptographically locked.");
        setPhase("expired");
      } else {
        setError(`Incorrect password. ${maxAttempts - newAttempts} attempt${maxAttempts - newAttempts !== 1 ? "s" : ""} remaining.`);
        setPhase("lock");
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }

  /* ── PERMANENTLY LOCKED ── */
  if (phase === "server-locked") {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-background px-6">
        {/* Background atmosphere */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-rose-500/8 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-rose-700/6 blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Home link */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => navigate("/")}
            className="mb-6 text-muted-foreground hover:text-foreground font-body text-sm flex items-center gap-2 transition-colors group"
          >
            <Home className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            clip<span className="text-primary">alpha</span>.com
          </motion.button>

          <div className="bg-card/80 backdrop-blur-2xl border border-rose-500/20 rounded-3xl p-10 shadow-[0_40px_100px_rgba(239,68,68,0.12)] overflow-hidden relative">
            {/* Corner glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-rose-800/10 blur-3xl pointer-events-none" />

            <motion.div
              animate={{ rotate: [0, -8, 8, -8, 0] }}
              transition={{ duration: 0.6, delay: 0.3, repeat: 2 }}
              className="w-20 h-20 rounded-[1.5rem] bg-rose-500/15 border-2 border-rose-500/30 flex items-center justify-center mx-auto mb-6 relative z-10"
            >
              <Lock className="w-9 h-9 text-rose-500" />
            </motion.div>

            <div className="text-center relative z-10">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Permanently Locked</h2>
              <p className="text-muted-foreground font-body text-sm mb-6 leading-relaxed">
                This clip was sealed after too many failed password attempts. The data is intact but inaccessible.
              </p>

              <div className="p-4 bg-rose-500/5 border border-rose-500/15 rounded-2xl mb-6 text-left">
                <p className="text-[11px] font-body font-bold text-rose-500/70 uppercase tracking-widest mb-1">Zero-Knowledge Guarantee</p>
                <p className="text-xs text-muted-foreground">Nobody — including clipalpha — can read this. Encrypted with AES-256-GCM, the key only lived in the sharer's browser.</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/")}
                className="w-full py-3.5 rounded-2xl bg-foreground text-background font-body font-bold"
              >
                Go Home
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── EXPIRED / LOCKED OUT ── */
  if (phase === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-background px-6">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-amber-500/7 blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
          className="relative z-10 w-full max-w-md"
        >
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => navigate("/")}
            className="mb-6 text-muted-foreground hover:text-foreground font-body text-sm flex items-center gap-2 transition-colors group"
          >
            <Home className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            clip<span className="text-primary">alpha</span>.com
          </motion.button>

          <div className="bg-card/80 backdrop-blur-2xl border border-border/50 rounded-3xl p-10 shadow-[0_40px_100px_rgba(0,0,0,0.09)] overflow-hidden relative">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 0.92, 1.08, 0.92, 1] }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-20 h-20 rounded-[1.5rem] bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center mx-auto mb-6"
            >
              <AlertTriangle className="w-9 h-9 text-amber-500" />
            </motion.div>

            <div className="text-center">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                {attempts >= maxAttempts ? "Clip Locked" : "Clip Expired"}
              </h2>
              <p className="text-muted-foreground font-body text-sm mb-6 leading-relaxed">
                {attempts >= maxAttempts
                  ? "This clip was cryptographically sealed after too many failed password attempts."
                  : "This encrypted clip has passed its expiry date or was permanently destroyed."}
              </p>
              <p className="text-muted-foreground/50 font-body text-xs mb-6">The data is permanently gone — that's zero-knowledge.</p>

              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/")}
                className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-body font-bold"
              >
                Go Home
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── BURN ANIMATION ── */
  if (phase === "burned") {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-background">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-rose-500/5" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="relative z-10 text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.25, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="w-28 h-28 rounded-[2rem] bg-gradient-to-tr from-orange-400 via-accent to-rose-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_100px_rgba(239,68,68,0.5)]"
          >
            <span className="text-5xl">🔥</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-heading text-4xl font-bold text-foreground mb-2"
          >
            Burning…
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground font-body"
          >
            Atomic data destruction in progress
          </motion.p>
        </motion.div>
      </div>
    );
  }

  /* ── REVEALED ── */
  if (phase === "revealed") {
    return <PasswordCard content={decryptedContent} meta={meta} />;
  }

  /* ══════════════════════════════════════════════════════════
     ── LOCK SCREEN (password entry + decrypting states) ──
  ══════════════════════════════════════════════════════════ */
  const isDecrypting = phase === "decrypting";

  // No password + no burn: show nothing while auto-decrypting — go directly to content
  if (autoUnlock && isDecrypting) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-background overflow-hidden px-6">

      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[140px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/8 blur-[100px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 22 }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* ── Back link ── */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => navigate("/")}
          className="mb-6 text-muted-foreground hover:text-foreground font-body text-sm flex items-center gap-2 transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          clip<span className="text-primary">alpha</span>.com
        </motion.button>

        {/* ── Main Card ── */}
        <div className="bg-card/70 backdrop-blur-2xl border border-border/50 rounded-3xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] relative">

          {/* Ambient corner lights */}
          <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

          {/* ── Header zone ── */}
          <div className="relative px-8 pt-10 pb-8 text-center border-b border-border/30">

            {/* Animated lock icon */}
            <motion.div
              animate={isDecrypting ? { rotate: 360 } : { y: [-4, 4, -4] }}
              transition={isDecrypting
                ? { duration: 1.2, repeat: Infinity, ease: "linear" }
                : { repeat: Infinity, duration: 4, ease: "easeInOut" }
              }
              className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-tr from-primary/90 via-primary to-accent flex items-center justify-center shadow-[0_15px_50px_-10px_hsl(var(--primary)/0.5)] mx-auto mb-5 relative"
            >
              {/* Inner ring */}
              <div className="absolute inset-0 rounded-[1.5rem] ring-2 ring-white/10" />
              <AnimatePresence mode="wait">
                {isDecrypting ? (
                  <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Loader2 className="w-9 h-9 text-white" />
                  </motion.div>
                ) : (
                  <motion.div key="icon" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    {meta.hasPassword ? <Lock className="w-9 h-9 text-white" /> : <Unlock className="w-9 h-9 text-white" />}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={isDecrypting ? "dec" : "lock"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="font-heading text-2xl font-bold text-foreground mb-1">
                  {isDecrypting ? "Decrypting…" : meta.hasPassword ? "This clip is locked" : "Ready to reveal"}
                </h1>
                <p className="text-muted-foreground font-body text-sm">
                  {isDecrypting
                    ? "PBKDF2 key derivation · AES-256-GCM…"
                    : meta.hasPassword
                    ? "Enter the password shared by the sender"
                    : "Click reveal to view this encrypted clip"
                  }
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Body zone ── */}
          <div className="px-8 py-7 relative">

            {/* Meta badges row */}
            {(meta.burnAfterRead || meta.expiresAt || meta.viewsRemaining !== null) && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex flex-wrap gap-2 justify-center mb-6"
              >
                {meta.burnAfterRead && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold border border-orange-500/20">
                    🔥 Burns after reading
                  </span>
                )}
                {meta.expiresAt && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    <CountdownTimer expiresAt={meta.expiresAt} compact />
                  </span>
                )}
                {meta.viewsRemaining !== null && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                    <Eye className="w-3 h-3" /> {meta.viewsRemaining} view{meta.viewsRemaining !== 1 ? "s" : ""} left
                  </span>
                )}
              </motion.div>
            )}

            {/* Password input */}
            {meta.hasPassword && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-5"
              >
                <label className="block text-[11px] font-body font-bold text-muted-foreground uppercase tracking-widest mb-2.5">
                  Password
                </label>
                <div className="relative group">
                  <input
                    ref={inputRef}
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleUnlock()}
                    placeholder="Enter decryption password…"
                    disabled={isDecrypting}
                    className="w-full bg-background/80 border border-border rounded-2xl px-4 py-3.5 pr-12 font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all disabled:opacity-50 text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      className="mt-2.5 flex items-center gap-2 text-accent text-xs font-body"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Attempt progress bar */}
            {attempts > 0 && attempts < maxAttempts && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-5"
              >
                <div className="flex justify-between text-[11px] font-body text-muted-foreground mb-1.5">
                  <span>Failed attempts</span>
                  <span className="text-accent font-bold">{attempts} / {maxAttempts}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(attempts / maxAttempts) * 100}%` }}
                    className="h-full bg-gradient-to-r from-amber-400 to-accent rounded-full"
                  />
                </div>
              </motion.div>
            )}

            {/* Decrypt / Reveal button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileHover={{ scale: 1.02, y: -2, boxShadow: "0 20px 50px -10px hsl(var(--primary)/0.45)" }}
              whileTap={{ scale: 0.97 }}
              onClick={handleUnlock}
              disabled={isDecrypting}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-body font-bold text-base shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.5)] hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
            >
              {isDecrypting ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Loader2 className="w-5 h-5" />
                  </motion.div>
                  Decrypting…
                </>
              ) : (
                <>
                  <Fingerprint className="w-5 h-5" />
                  {meta.hasPassword ? "Decrypt Clip" : "Reveal Clip"}
                </>
              )}
            </motion.button>

            {/* Trust footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-[11px] text-muted-foreground/60 font-body mt-4 flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3 h-3 text-emerald-500" />
              AES-256-GCM · Decrypted entirely in your browser · We never see the key
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
