import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import {
  Lock, Flame, Eye, EyeOff, Shield, Loader2,
  CheckCircle2, AlertTriangle, Globe, X, KeyRound, FileUp, Trash2,
  Image as ImageIcon, File as FileIcon, Paperclip,
  Minus, Plus, Clock, ChevronRight, FileText, ChevronLeft, Download, ExternalLink,
  Type, Code, Pencil, CheckSquare
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createClip, getPresignedUploadUrl, uploadFileToS3 } from "../../utils/api";
import { encryptText, hashPassword } from "../../utils/crypto";
import SlugPicker from "./SlugPicker";
import { CodeEditor, DrawingEditor, TasksEditor, StegoEditor, TaskItem, TabType } from "./RichEditors";
import { ExpiryDrum, EXPIRY_OPTIONS } from "./ExpiryDrum";

/* ─── helpers ─── */
function formatBytes(bytes?: number, decimals = 1) {
  if (!bytes) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

function randomSlug() {
  const adj = ["alpha", "swift", "nova", "dark", "silent", "iron", "ghost", "secure", "zero", "cipher"];
  const noun = ["key", "lock", "clip", "vault", "note", "pass", "byte", "drop", "seal", "link"];
  const num = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
  return `${adj[Math.floor(Math.random() * adj.length)]}-${noun[Math.floor(Math.random() * noun.length)]}-${num}`;
}

// EXPIRY_OPTIONS is imported from ExpiryDrum

/* ─── Success Screen ─── */
function SuccessScreen({ shareUrl, onReset }: { shareUrl: string; onReset: () => void }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }} className="w-full max-w-md">
        <div className="border border-border rounded-3xl bg-card p-10 shadow-lg text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
            className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-7 h-7 text-background" />
          </motion.div>
          <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Clip secured</h2>
          <p className="text-muted-foreground text-sm font-body mb-8">Share this link — it's ready to go.</p>
          <div className="bg-muted rounded-2xl p-3 flex items-center gap-3 mb-4 text-left">
            <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="flex-1 font-mono text-sm text-foreground truncate">{shareUrl}</span>
            <button onClick={handleCopy}
              className="text-xs font-semibold font-body text-foreground border border-border rounded-xl px-4 py-2 hover:bg-muted transition-colors">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCopy}
              className="flex-1 py-3.5 rounded-2xl bg-foreground text-background font-body font-semibold text-sm hover:opacity-90 transition-opacity">
              Copy Link
            </button>
            <button onClick={() => navigate("/")}
              className="px-6 py-3.5 rounded-2xl border border-border text-muted-foreground font-body font-semibold text-sm hover:bg-muted transition-colors">
              Home
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── BentoCard: Reusable grid card ─── */
interface BentoCardProps {
  icon: React.ElementType;
  title: string;
  active?: boolean;
  onToggle?: () => void;
  toggleColor?: string;
  glowColor?: string;
  className?: string;
  children?: React.ReactNode;
}

function BentoCard({
  icon: Icon, title, active = true, onToggle, toggleColor = "bg-foreground", glowColor = "rgba(120,120,255,0.08)", className = "", children
}: BentoCardProps) {
  const isToggleable = onToggle !== undefined;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      className={`relative rounded-2xl md:rounded-3xl p-3 md:p-5 flex flex-col gap-1.5 md:gap-2 overflow-hidden transition-all duration-300 ease-out hover:scale-[1.015] hover:-translate-y-0.5 z-0 hover:z-10 ${className} ${active ? 'border border-border/60 shadow-lg bg-card' : 'border border-border/40 bg-card/60 shadow-sm hover:shadow-md hover:bg-card/90'}`}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 z-0"
        style={{ background: `radial-gradient(180px circle at ${mouseX}px ${mouseY}px, ${glowColor}, transparent 70%)` }}
      />

      {active && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none z-0"
          style={{ background: `radial-gradient(120px circle at 0px 0px, ${glowColor}, transparent)` }}
        />
      )}

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${active ? 'bg-foreground text-background shadow-sm' : 'bg-muted text-muted-foreground border border-border'}`}>
            <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </div>
          <span className={`font-body font-black text-[13px] md:text-[15px] tracking-tight transition-colors ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
            {title}
          </span>
        </div>
        
        {isToggleable && (
          <button type="button" onClick={onToggle} className={`w-9 h-[18px] md:w-11 md:h-[22px] rounded-full flex items-center px-[2px] md:px-[3px] transition-colors duration-300 cursor-pointer shadow-inner ${active ? toggleColor + ' justify-end' : 'bg-muted justify-start border border-border'}`}>
            <motion.div layout transition={{ type: "spring", stiffness: 500, damping: 28 }} className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.15)] ring-1 ring-black/5" />
          </button>
        )}
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─── */
interface CreateWorkspaceProps { slug: string; }

export default function CreateWorkspace({ slug }: CreateWorkspaceProps) {
  const navigate = useNavigate();

  const [customSlug, setCustomSlug] = useState(slug);
  const [slugValid, setSlugValid] = useState(true);
  useEffect(() => {
    if (customSlug) window.history.replaceState(null, "", `/${customSlug}`);
  }, [customSlug]);

  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileProgress, setFileProgress] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSpeed, setUploadSpeed] = useState<string>(""); // e.g. "4.2 MB/s"
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Presigned URL pre-fetch cache ────────────────────────────────────────────
  // Key: "slug|filename|size|index"  Value: { uploadUrl, s3Key }
  // Fires immediately when files are added so Lambda cold-start is OFF the critical path.
  const presignCache = useRef<Map<string, { uploadUrl: string; s3Key: string }>>(new Map());
  const presignInFlight = useRef<Set<string>>(new Set());

  function presignKey(slug: string, file: File, index: number) {
    return `${slug}|${file.name}|${file.size}|${index}`;
  }

  // Pre-fetch whenever selectedFiles or customSlug changes
  useEffect(() => {
    if (!customSlug || selectedFiles.length === 0) return;
    selectedFiles.forEach((file, i) => {
      const key = presignKey(customSlug, file, i);
      if (presignCache.current.has(key) || presignInFlight.current.has(key)) return;
      presignInFlight.current.add(key);
      getPresignedUploadUrl(customSlug, file, i)
        .then(result => { presignCache.current.set(key, result); })
        .catch(() => { /* silent — will re-try in handleCreate */ })
        .finally(() => { presignInFlight.current.delete(key); });
    });
  }, [selectedFiles, customSlug]);

  // Clear cache on slug change so stale URLs are not used
  const prevSlug = useRef(customSlug);
  useEffect(() => {
    if (prevSlug.current !== customSlug) {
      presignCache.current.clear();
      prevSlug.current = customSlug;
    }
  }, [customSlug]);

  const placeholders = [
    "Paste API keys...",
    "Drop configuration files...",
    "Share sensitive credentials...",
    "Draft private notes...",
    "Store confidential links..."
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderText, setPlaceholderText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const currentFullText = placeholders[placeholderIndex];

    if (isDeleting) {
      if (placeholderText.length > 0) {
        timeout = setTimeout(() => setPlaceholderText(currentFullText.substring(0, placeholderText.length - 1)), 25);
      } else {
        setIsDeleting(false);
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      }
    } else {
      if (placeholderText.length < currentFullText.length) {
        timeout = setTimeout(() => setPlaceholderText(currentFullText.substring(0, placeholderText.length + 1)), 45);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2500);
      }
    }

    return () => clearTimeout(timeout);
  }, [placeholderText, isDeleting, placeholderIndex]);

  // Options state
  const [expirySeconds, setExpirySeconds] = useState(24 * 60 * 60);
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [hasViewLimit, setHasViewLimit] = useState(false);
  const [viewLimit, setViewLimit] = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('text');
  const [slideDir, setSlideDir] = useState(1);
  const [codeContent, setCodeContent] = useState("");
  const [drawingDataUrl, setDrawingDataUrl] = useState("");
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const TAB_ORDER: TabType[] = ['text', 'code', 'drawing', 'tasks', 'stego'];
  function switchTab(tab: TabType) {
    const dir = TAB_ORDER.indexOf(tab) >= TAB_ORDER.indexOf(activeTab) ? 1 : -1;
    setSlideDir(dir);
    setActiveTab(tab);
  }

  const hasContent = (content.trim().length > 0) || 
                     (codeContent.trim().length > 0) ||
                     (drawingDataUrl.length > 0) ||
                     (tasks.length > 0) ||
                     selectedFiles.length > 0;
  const charCount = content.length;

  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  async function handleCreate() {
    setError("");
    if (!hasContent) { setError("Add content or attach a file first."); return; }
    if (!customSlug.trim()) { setError("Set a URL for your clip."); return; }
    if (!slugValid) { setError("That URL is already taken."); return; }
    if (hasPassword && !password.trim()) { setError("Enter a password or disable the lock."); return; }

    setSubmitting(true);
    try {
      const pwHash = hasPassword ? await hashPassword(password) : null;
      const payload: Record<string, unknown> = { slug: customSlug, burnAfterRead, expirySeconds, hasPassword };
      if (pwHash) payload.passwordHash = pwHash;
      if (hasViewLimit) payload.viewLimit = viewLimit;

      const textTrim = content.trim();
      const codeTrim = codeContent.trim();

      // Start with user-attached files
      let filesToUpload = [...selectedFiles];
      let textS3FileIndex  = -1;
      let codeS3FileIndex  = -1;
      let drawingS3KeyIndex = -1;

      // ── Text → always a File so the POST body stays tiny forever ──
      if (textTrim.length > 0) {
        textS3FileIndex = filesToUpload.length;
        filesToUpload.push(new File([textTrim], 'clip-text.txt', { type: 'text/plain' }));
      }

      // ── Code → always a File ──
      if (codeTrim.length > 0) {
        codeS3FileIndex = filesToUpload.length;
        filesToUpload.push(new File([codeTrim], 'clip-code.txt', { type: 'text/plain' }));
      }

      // ── Drawing → File (existing behaviour) ──
      if (drawingDataUrl.length > 0) {
        const arr = drawingDataUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) { u8arr[n] = bstr.charCodeAt(n); }
        drawingS3KeyIndex = filesToUpload.length;
        filesToUpload.push(new File([u8arr], "shared-drawing.png", { type: mime }));
      }

      setIsUploading(true);
      setFileProgress(filesToUpload.map(() => 0));

      let uploadedFiles: Array<{ s3Key: string; name: string; type: string; size: number }>;
      try {
        const presigned = await Promise.all(
          filesToUpload.map((file, i) => {
            const key = presignKey(customSlug, file, i);
            return presignCache.current.get(key)
              ? Promise.resolve(presignCache.current.get(key)!)
              : getPresignedUploadUrl(customSlug, file, i);
          })
        );

        const startedAt = Date.now();
        let loadedTotal = 0;
        const perFileLoaded = filesToUpload.map(() => 0);

        await Promise.all(
          filesToUpload.map((file, i) =>
            uploadFileToS3(presigned[i].uploadUrl, file, (pct) => {
              setFileProgress(prev => { const n = [...prev]; n[i] = pct; return n; });
              const prevLoaded = perFileLoaded[i];
              const nowLoaded  = Math.round((pct / 100) * file.size);
              perFileLoaded[i] = nowLoaded;
              loadedTotal += nowLoaded - prevLoaded;
              const elapsedSec = (Date.now() - startedAt) / 1000;
              if (elapsedSec > 0.5) {
                const mbps = (loadedTotal / elapsedSec / (1024 * 1024)).toFixed(1);
                setUploadSpeed(`${mbps} MB/s`);
              }
            })
          )
        );
        setUploadSpeed("");

        uploadedFiles = presigned.map((p, i) => ({
          s3Key: p.s3Key,
          name:  filesToUpload[i].name,
          type:  filesToUpload[i].type,
          size:  filesToUpload[i].size,
        }));
      } catch (err: any) {
        setError(`Upload failed: ${err.message}`);
        setIsUploading(false);
        setSubmitting(false);
        setUploadSpeed("");
        return;
      }
      setIsUploading(false);

      // Build multiData with only s3 keys — ciphertext stays tiny regardless of content size
      const multiData: any = {};
      if (textS3FileIndex !== -1 && uploadedFiles[textS3FileIndex]) {
        multiData.text_s3 = uploadedFiles[textS3FileIndex].s3Key;
      }
      if (codeS3FileIndex !== -1 && uploadedFiles[codeS3FileIndex]) {
        multiData.code_s3 = uploadedFiles[codeS3FileIndex].s3Key;
      }
      if (tasks.length > 0) {
        multiData.tasks = tasks;
      }
      if (drawingS3KeyIndex !== -1 && uploadedFiles[drawingS3KeyIndex]) {
        multiData.drawing = uploadedFiles[drawingS3KeyIndex].s3Key;
      }

      const rawText = Object.keys(multiData).length > 0
        ? JSON.stringify({ format: 'multi', data: multiData })
        : "";

      const pw = hasPassword ? password : "pastit-default-no-password";
      const encryptedText = rawText ? await encryptText(rawText, pw) : "";

      // All files (text/code/drawing/user-attached) appear in masterPayload.files → visible in Files tab
      const masterPayload = { text: encryptedText, files: uploadedFiles };
      payload.ciphertext = JSON.stringify(masterPayload);
      payload.contentType = "multipart";

      await createClip(payload);
      setShareUrl(`${window.location.origin}/${customSlug}`);
    } catch (err: any) {
      if (err?.status === 409) setError("URL taken — pick another.");
      else setError(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (shareUrl) {
    return <SuccessScreen shareUrl={shareUrl} onReset={() => {
      setShareUrl(null); setContent(""); setSelectedFiles([]); setCustomSlug(randomSlug());
    }} />;
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden relative">
      
      {/* ── 1. Top Navigation ── */}
      {/* Mobile: 2-row (logo+create | slug). Desktop: 3-col (logo | slug-center | create). */}
      <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center px-3 md:px-5 py-1 bg-card/80 backdrop-blur-md border-b border-border/40 z-40 gap-1.5">

        {/* LEFT col (desktop) / Row 1 left (mobile): Logo */}
        <div className="flex items-center justify-between md:justify-start md:flex-1">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 font-heading text-base font-black text-foreground tracking-tight hover:opacity-70 transition-opacity shrink-0">
            <img src="/favicon.png" alt="clipalpha" className="w-6 h-6 rounded-md select-none" />
            clip<span className="text-primary">alpha</span>
          </button>

          {/* Mobile-only: error + create button sit next to logo in row 1 */}
          <div className="flex md:hidden items-center gap-2">
            <AnimatePresence>
              {error && (
                <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="text-xs font-body text-red-500 bg-red-500/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-red-500/20 max-w-[140px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{error}</span>
                </motion.span>
              )}
            </AnimatePresence>
            <motion.button onClick={handleCreate} disabled={submitting || isUploading || !hasContent}
              whileHover={hasContent && !submitting && !isUploading ? { scale: 1.03 } : {}}
              whileTap={hasContent && !submitting && !isUploading ? { scale: 0.96 } : {}}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background font-body font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed">
              {(submitting || isUploading) ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Loader2 className="w-4 h-4" /></motion.div> : <Lock className="w-4 h-4" />}
              {isUploading ? `${Math.round(fileProgress.reduce((a, b) => a + b, 0) / Math.max(fileProgress.length, 1))}%` : submitting ? "…" : "Create"}
            </motion.button>
          </div>
        </div>

        {/* CENTER col (desktop) / Row 2 full-width (mobile): Slug picker */}
        <div className="w-full md:flex-1 md:max-w-sm flex items-center justify-center">
          <SlugPicker slug={customSlug} onSlugChange={setCustomSlug} onValidityChange={setSlugValid} />
        </div>

        {/* RIGHT col (desktop only): error + create button */}
        <div className="hidden md:flex items-center justify-end gap-4 flex-1">
          <AnimatePresence>
            {error && (
              <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="text-xs font-body text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-red-500/20">
                <AlertTriangle className="w-3.5 h-3.5" /> {error}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.button onClick={handleCreate} disabled={submitting || isUploading || !hasContent}
            whileHover={hasContent && !submitting && !isUploading ? { scale: 1.03 } : {}}
            whileTap={hasContent && !submitting && !isUploading ? { scale: 0.96 } : {}}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-foreground text-background font-body font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed">
            {(submitting || isUploading) ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Loader2 className="w-4 h-4" /></motion.div> : <Lock className="w-4 h-4" />}
            {isUploading
              ? `${Math.round(fileProgress.reduce((a,b)=>a+b,0) / Math.max(fileProgress.length,1))}%${uploadSpeed ? ` • ${uploadSpeed}` : ""}`
              : submitting ? "Sealing…" : "Create Clip"}
          </motion.button>
        </div>

      </div>

      {/* ── 2. Settings Bento ── */}
      {/* Mobile: 2×2 grid — Expires|Burn row1, Password|Views row2  */}
      {/* Desktop: single 12-col row — Expires|Password|Views|Burn */}
      <div className="flex-shrink-0">
        <div className="w-full px-3 md:px-5 py-0.5">
          <div className="grid grid-cols-2 lg:grid-cols-12 gap-1.5 md:gap-2">

            {/* Expires — drum-roll picker. Mobile: col1 row1 | Desktop: 3 cols, FIRST */}
            <BentoCard icon={Clock} title="Expires" active={!burnAfterRead}
              className="col-span-1 lg:col-span-3 order-1 lg:order-1 shadow-sm p-2 md:p-2 theme-cascade-1"
              glowColor="rgba(56,189,248,0.12)">
              <div className="mt-1 w-full">
                <ExpiryDrum
                  value={expirySeconds}
                  onChange={(secs) => {
                    if (burnAfterRead) { setError("Turn off 'Burn' to set a custom expiry."); return; }
                    setExpirySeconds(secs);
                  }}
                  disabled={burnAfterRead}
                />
              </div>
            </BentoCard>

            {/* Burn — mobile: col2 row1 | desktop: SECOND, 2 cols */}
            <BentoCard icon={Flame} title="Burn" active={burnAfterRead}
              onToggle={() => setBurnAfterRead(!burnAfterRead)}
              toggleColor="bg-orange-500"
              className="col-span-1 lg:col-span-2 order-2 lg:order-2 shadow-sm p-2 md:p-2 theme-cascade-4"
              glowColor="rgba(249,115,22,0.12)">
              <div className="flex-1 flex flex-col justify-end mt-[2px] md:mt-1">
                <p className={`text-[10px] md:text-[12px] uppercase tracking-wider font-body font-black leading-tight transition-colors ${burnAfterRead ? 'text-orange-600 dark:text-orange-500' : 'text-muted-foreground'}`}>
                  {burnAfterRead ? "On Read" : "Off"}
                </p>
              </div>
            </BentoCard>

            {/* Password — mobile: col1 row2 | desktop: THIRD, 4 cols */}
            <BentoCard icon={KeyRound} title="Password" active={hasPassword}
              onToggle={() => setHasPassword(!hasPassword)}
              toggleColor="bg-indigo-400"
              className="col-span-1 lg:col-span-4 order-3 lg:order-3 shadow-sm p-2 md:p-2 theme-cascade-2"
              glowColor="rgba(99,102,241,0.12)">
              <div className={`transition-all duration-300 mt-[2px] md:mt-1 relative flex-1 flex flex-col justify-end ${hasPassword ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-1 pointer-events-none'}`}>
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} disabled={!hasPassword} placeholder="Secret..."
                  className="w-full bg-card border-2 border-border shadow-sm rounded-lg md:rounded-xl px-2.5 py-1 md:px-3 md:py-1.5 pr-8 text-[12px] md:text-sm font-body font-black text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:bg-muted disabled:opacity-50 disabled:text-muted-foreground" />
                <button type="button" onClick={() => setShowPw(!showPw)} disabled={!hasPassword} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-indigo-400/60 hover:text-indigo-500 transition-colors">
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </BentoCard>

            {/* Views — mobile: col2 row2 | desktop: FOURTH/LAST, 3 cols */}
            <BentoCard icon={Eye} title="Views" active={hasViewLimit}
              onToggle={() => setHasViewLimit(!hasViewLimit)}
              toggleColor="bg-emerald-400"
              className="col-span-1 lg:col-span-3 order-4 lg:order-4 shadow-sm p-2 md:p-2 theme-cascade-3"
              glowColor="rgba(52,211,153,0.12)">
              <div className={`flex items-center justify-between transition-all duration-300 mt-[2px] md:mt-1 flex-1 px-0.5 md:px-1 ${hasViewLimit ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-1 pointer-events-none'}`}>
                <button onClick={() => setViewLimit(Math.max(1, Number(viewLimit) - 1))} className="w-5 h-5 md:w-8 md:h-8 rounded-md md:rounded-lg bg-card border-2 border-border shadow-sm flex items-center justify-center text-foreground font-black hover:bg-muted hover:border-foreground/20 transition-all flex-shrink-0">
                  <Minus className="w-2.5 h-2.5 md:w-4 md:h-4" />
                </button>
                <input
                  type="text" inputMode="numeric"
                  value={viewLimit}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setViewLimit(val === '' ? ('' as any) : Math.min(100, parseInt(val)));
                  }}
                  onBlur={() => setViewLimit(Math.max(1, Number(viewLimit) || 1))}
                  className="w-8 md:w-14 text-center bg-transparent font-heading font-black text-base md:text-2xl text-foreground tabular-nums focus:outline-none focus:bg-muted rounded-md transition-colors"
                />
                <button onClick={() => setViewLimit(Math.min(100, Number(viewLimit) + 1))} className="w-5 h-5 md:w-8 md:h-8 rounded-md md:rounded-lg bg-card border-2 border-border shadow-sm flex items-center justify-center text-foreground font-black hover:bg-muted hover:border-foreground/20 transition-all flex-shrink-0">
                  <Plus className="w-2.5 h-2.5 md:w-4 md:h-4" />
                </button>
              </div>
            </BentoCard>

          </div>
        </div>
      </div>

      {/* ── 3. Main Content (Canvas + Attachment Combined) ── */}
      <div className="flex-1 w-full px-3 md:px-5 pt-2 pb-0 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col lg:flex-row relative rounded-t-2xl md:rounded-2xl border border-b-0 md:border-b border-border bg-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] overflow-hidden min-h-0 theme-cascade-5">
          
          {/* Content Space (Left side) */}
          <div className={`flex flex-col relative border-b-4 lg:border-b-0 lg:border-r-4 border-border/60 min-h-0 transition-all ${activeTab === 'files' ? 'flex-none border-b-0 lg:border-b-4 lg:flex-1' : 'flex-1 min-h-[55dvh] lg:min-h-0'}`}>
            
            {/* Tabs */}
            {(() => {
              const tabConfig: Record<string, { label: string; icon: React.ReactNode; activeClass: string }> = {
                text:    { label: 'Text',    icon: <Type className="w-3.5 h-3.5" />,        activeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' },
                code:    { label: 'Code',    icon: <Code className="w-3.5 h-3.5" />,        activeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
                drawing: { label: 'Drawing', icon: <Pencil className="w-3.5 h-3.5" />,     activeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30' },
                tasks:   { label: 'Tasks',   icon: <CheckSquare className="w-3.5 h-3.5" />, activeClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30' },
                stego:   { label: 'Stego',   icon: <EyeOff className="w-3.5 h-3.5" />,     activeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' },
                files:   { label: `Files (${selectedFiles.length})`, icon: <Paperclip className="w-3.5 h-3.5" />, activeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30' },
              };
              return (
                <div className="flex items-center gap-1 md:gap-1.5 border-b-2 border-border/40 px-3 md:px-4 py-2 md:py-2.5 bg-muted/10 overflow-x-auto hide-scrollbars">
                  {(['text', 'files', 'code', 'drawing', 'tasks', 'stego'] as TabType[]).map(tab => {
                    const cfg = tabConfig[tab];
                    const isActive = activeTab === tab;
                    return (
                      <motion.button
                        key={tab}
                        onClick={() => switchTab(tab)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        title={cfg.label}
                        className={`relative flex items-center gap-1.5 px-2.5 md:px-4 py-2 rounded-xl text-xs font-bold font-body border transition-colors duration-150 ${
                          isActive
                            ? `${cfg.activeClass} border-foreground/10`
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                        } ${tab === 'files' ? 'lg:hidden' : ''}`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="create-tab-bg"
                            className={`absolute inset-0 rounded-xl ${cfg.activeClass} shadow-sm`}
                            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                          />
                        )}
                        {/* Mobile: icon only. Desktop: icon + label */}
                        <span className="relative z-10 flex items-center gap-1.5">
                          {cfg.icon}
                          <span className="hidden md:inline tracking-wide">{cfg.label}</span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              );
            })()}

            {/* Dynamic Content Body */}
            <div className={`relative overflow-hidden min-h-0 transition-all ${activeTab === 'files' ? 'hidden lg:block lg:flex-1' : 'flex-1'}`}>
              <AnimatePresence mode="wait" custom={slideDir}>
                <motion.div
                  key={activeTab}
                  custom={slideDir}
                  initial={{ x: slideDir * 48, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -slideDir * 48, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  className="absolute inset-0 flex flex-col"
                >
                  {activeTab === 'text' && (
                    <div className="flex-1 flex flex-col p-6 pt-4 relative">
                      <div className="absolute top-4 right-6 flex items-center gap-3 text-xs font-mono font-bold text-muted-foreground/50 pointer-events-none">
                        {charCount > 0 && <span>{charCount.toLocaleString()} chars</span>}
                      </div>
                      <textarea
                        ref={textareaRef}
                        autoFocus
                        wrap="off"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Tab') {
                            e.preventDefault();
                            const target = e.target as HTMLTextAreaElement;
                            const start = target.selectionStart;
                            const end = target.selectionEnd;
                            setContent(content.substring(0, start) + "\t" + content.substring(end));
                            setTimeout(() => { target.selectionStart = target.selectionEnd = start + 1; }, 0);
                          }
                        }}
                        onPaste={e => {
                          if (e.clipboardData.files && e.clipboardData.files.length > 0) {
                            const items = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('text/'));
                            if (items.length > 0) setSelectedFiles(prev => [...prev, ...items]);
                          }
                        }}
                        placeholder={placeholderText + (placeholderText.length === placeholders[placeholderIndex].length ? "" : "▌")}
                        className="flex-1 w-full bg-transparent font-mono text-[15px] font-medium leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/40 text-foreground custom-scrollbar"
                      />
                    </div>
                  )}
                  {activeTab === 'code'    && <CodeEditor content={codeContent} setContent={setCodeContent} />}
                  {activeTab === 'drawing' && <DrawingEditor initialDataUrl={drawingDataUrl} onDrawingChange={setDrawingDataUrl} />}
                  {activeTab === 'tasks'   && <TasksEditor tasks={tasks} setTasks={setTasks} />}
                  {activeTab === 'stego'   && <StegoEditor />}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {activeTab !== 'stego' && (
              <div className={`px-4 py-2 border-t border-border/30 items-center justify-between pointer-events-none opacity-60 z-10 shrink-0 ${activeTab === 'files' ? 'hidden lg:flex' : 'flex'}`}>
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-body text-muted-foreground font-semibold tracking-wide uppercase">AES-256-GCM Encrypted</span>
                </div>
              </div>
            )}
          </div>

          {/* Attachment Sidebar (Right side, seamlessly integrated) */}
          <div className={`lg:w-[320px] flex-shrink-0 flex-col relative overflow-hidden overflow-x-hidden min-h-0 ${activeTab === 'files' ? 'flex-1 w-full flex' : 'hidden lg:flex w-full'}`}>
            <AnimatePresence mode="wait">
              {!activeGroup ? (
                <motion.div key="buckets" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between gap-3 mb-1 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-background border-2 border-border shadow-sm text-foreground ring-1 ring-border/50">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-body font-bold text-[14px] tracking-tight text-foreground">
                          Attachments
                        </span>
                        <AnimatePresence mode="wait">
                          {selectedFiles.length > 0 ? (
                            <motion.span
                              key="size"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.2 }}
                              className="text-[11px] font-mono font-bold text-primary tabular-nums"
                            >
                              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} · {formatBytes(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
                            </motion.span>
                          ) : (
                            <motion.span
                              key="empty"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-[11px] font-body text-muted-foreground/60"
                            >
                              No files added
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    {selectedFiles.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => {
                           selectedFiles.forEach((f, idx) => {
                             setTimeout(() => {
                               const url = URL.createObjectURL(f);
                               const link = document.createElement("a");
                               link.href = url;
                               link.download = f.name;
                               link.click();
                               setTimeout(() => URL.revokeObjectURL(url), 100);
                             }, idx * 300);
                           });
                        }} className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 rounded-xl transition-colors" title="Download All Files">
                          <Download className="w-4 h-4"/>
                        </button>
                        <button onClick={() => {
                           setSelectedFiles([]);
                           setActiveGroup(null);
                        }} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl transition-colors" title="Remove All Files">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Total size progress bar */}
                  <AnimatePresence>
                    {selectedFiles.length > 0 && (() => {
                      const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);
                      const limitBytes = 5 * 1024 * 1024 * 1024; // 5GB S3 limit
                      const pct = Math.min((totalBytes / limitBytes) * 100, 100);
                      const isWarn = pct > 70;
                      const isDanger = pct > 90;
                      return (
                        <motion.div
                          initial={{ opacity: 0, scaleX: 0 }}
                          animate={{ opacity: 1, scaleX: 1 }}
                          exit={{ opacity: 0 }}
                          className="mb-3 shrink-0"
                        >
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                              className={`h-full rounded-full transition-colors ${
                                isDanger ? 'bg-rose-500' : isWarn ? 'bg-amber-400' : 'bg-primary'
                              }`}
                            />
                          </div>
                          {isDanger && (
                            <p className="text-[10px] text-rose-500 font-bold mt-1">⚠ Approaching 5 GB S3 limit</p>
                          )}
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>

                  {selectedFiles.length === 0 ? (
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleFileDrop} onClick={() => fileInputRef.current?.click()}
                      className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all min-h-[200px] ${isDragging ? "border-foreground/40 bg-foreground/5 scale-[1.02]" : "border-border/80 hover:border-foreground/40 hover:bg-muted/50 bg-background/50"}`}
                    >
                      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
                      <div className="p-3 bg-background rounded-2xl shadow-sm border border-border/50 text-foreground/70">
                        <FileUp className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-body font-bold text-foreground">Drop files here</p>
                      <p className="text-[10px] font-body font-bold text-muted-foreground/60 uppercase tracking-widest leading-relaxed text-center px-4">Images, Docs, PDFs<br/>Up to 5GB total</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar gap-3 pb-8">
                      {(() => {
                         const groups: Record<string, File[]> = { all: selectedFiles, images: [], pdfs: [] };
                         selectedFiles.forEach(f => {
                            if (f.type.startsWith('image/')) { groups.images.push(f); }
                            else if (f.type === 'application/pdf') { groups.pdfs.push(f); }
                            else {
                               const extMatch = f.name.match(/\.([^.]+)$/);
                               const ext = extMatch ? extMatch[1].toLowerCase() : 'txt';
                               if (!groups[ext]) groups[ext] = [];
                               groups[ext].push(f);
                            }
                         });

                         return (
                           <>
                             {/* ALL FILES */}
                             <button onClick={() => setActiveGroup('all')} className="w-full p-4 bg-background border border-border shadow-sm rounded-2xl flex items-center justify-between hover:bg-muted/50 transition-all hover:scale-[1.02]">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                                     <Paperclip className="w-5 h-5"/>
                                   </div>
                                   <div className="text-left min-w-0">
                                     <p className="text-sm font-bold text-foreground truncate">All Files</p>
                                     <p className="text-[10px] text-muted-foreground">{selectedFiles.length} total</p>
                                   </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                             </button>

                             {groups.images.length > 0 && (
                               <button onClick={() => setActiveGroup('images')} className="p-4 bg-background border border-border shadow-sm rounded-2xl flex items-center justify-between hover:bg-muted/50 transition-all hover:scale-[1.02]">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0"><ImageIcon className="w-5 h-5"/></div>
                                     <div className="text-left min-w-0"><p className="text-sm font-bold text-foreground truncate">Images</p><p className="text-[10px] text-muted-foreground">{groups.images.length} files</p></div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                               </button>
                             )}
                             {groups.pdfs.length > 0 && (
                               <button onClick={() => setActiveGroup('pdfs')} className="p-4 bg-background border border-border shadow-sm rounded-2xl flex items-center justify-between hover:bg-muted/50 transition-all hover:scale-[1.02]">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"><FileText className="w-5 h-5"/></div>
                                     <div className="text-left min-w-0"><p className="text-sm font-bold text-foreground truncate">PDFs</p><p className="text-[10px] text-muted-foreground">{groups.pdfs.length} files</p></div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                               </button>
                             )}
                             {Object.entries(groups).map(([ext, files]) => {
                               if (['all', 'images', 'pdfs'].includes(ext) || files.length === 0) return null;
                               return (
                                 <button key={ext} onClick={() => setActiveGroup(ext)} className="p-4 bg-background border border-border shadow-sm rounded-2xl flex items-center justify-between hover:bg-muted/50 transition-all hover:scale-[1.02]">
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0"><FileIcon className="w-5 h-5"/></div>
                                       <div className="text-left min-w-0">
                                         <p className="text-sm font-bold text-foreground uppercase truncate">{ext}</p>
                                         <p className="text-[10px] text-muted-foreground">{files.length} files</p>
                                       </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                 </button>
                               );
                             })}
                           </>
                         )
                      })()}

                      <button onClick={() => fileInputRef.current?.click()} className="mt-2 flex items-center justify-center gap-2 text-[12px] font-body font-bold text-foreground hover:bg-muted/50 transition-colors p-3 rounded-xl border border-dashed border-border/80 bg-background/50">
                        <Plus className="w-4 h-4"/> Add More Files
                      </button>
                      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="files" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 p-6 flex flex-col h-full bg-background/50 shadow-inner">
                  <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                       <button onClick={() => setActiveGroup(null)} className="p-2 -ml-2 hover:bg-muted/80 rounded-xl transition-colors text-muted-foreground hover:text-foreground flex items-center justify-center">
                         <ChevronLeft className="w-5 h-5" />
                       </button>
                       <span className="font-body font-bold text-[14px] tracking-tight text-foreground uppercase">
                         {activeGroup === 'all' ? 'All Files' : activeGroup === 'images' ? 'Images' : activeGroup === 'pdfs' ? 'PDFs' : activeGroup}
                       </span>
                    </div>
                    {(() => {
                       let currentFiles = [];
                       if (activeGroup === 'all') currentFiles = selectedFiles;
                       else if (activeGroup === 'images') currentFiles = selectedFiles.filter(f => f.type.startsWith('image/'));
                       else if (activeGroup === 'pdfs') currentFiles = selectedFiles.filter(f => f.type === 'application/pdf');
                       else {
                          currentFiles = selectedFiles.filter(f => {
                             const extMatch = f.name.match(/\.([^.]+)$/);
                             const ext = extMatch ? extMatch[1].toLowerCase() : 'txt';
                             return ext === activeGroup && !f.type.startsWith('image/') && f.type !== 'application/pdf';
                          });
                       }
                       
                       return currentFiles.length > 1 ? (
                         <div className="flex items-center gap-1.5">
                           <button onClick={() => {
                              currentFiles.forEach((f, idx) => {
                                setTimeout(() => {
                                  const url = URL.createObjectURL(f);
                                  const link = document.createElement("a");
                                  link.href = url;
                                  link.download = f.name || "downloaded-file";
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  setTimeout(() => URL.revokeObjectURL(url), 100);
                                }, idx * 300);
                              });
                           }} className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 rounded-xl transition-colors relative group" title="Download All">
                             <Download className="w-4 h-4"/>
                           </button>
                           <button onClick={() => {
                              setSelectedFiles(prev => prev.filter(file => !currentFiles.includes(file)));
                              setActiveGroup(null);
                           }} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl transition-colors" title="Remove All in Category">
                             <Trash2 className="w-4 h-4"/>
                           </button>
                         </div>
                       ) : null;
                    })()}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pb-8">
                    {(() => {
                        let filesList = [];
                        if (activeGroup === 'all') filesList = selectedFiles;
                        else if (activeGroup === 'images') filesList = selectedFiles.filter(f => f.type.startsWith('image/'));
                        else if (activeGroup === 'pdfs') filesList = selectedFiles.filter(f => f.type === 'application/pdf');
                        else {
                           filesList = selectedFiles.filter(f => {
                              const extMatch = f.name.match(/\.([^.]+)$/);
                              const ext = extMatch ? extMatch[1].toLowerCase() : 'txt';
                              return ext === activeGroup && !f.type.startsWith('image/') && f.type !== 'application/pdf';
                           });
                        }

                        return filesList.map((f, i) => {
                          const fileIndex = selectedFiles.indexOf(f);
                          return (
                          <div key={i} className="flex flex-col sm:flex-row shadow-sm sm:items-center gap-2 p-3 rounded-2xl border border-border/60 bg-background hover:bg-muted/30 transition-colors">
                            <div className="flex-1 min-w-0 pr-2">
                              <p 
                                onClick={() => window.open(URL.createObjectURL(f))} 
                                className="text-sm font-body text-foreground font-semibold truncate hover:text-indigo-500 transition-colors cursor-pointer"
                                title="Open in new tab"
                              >
                                {f.name}
                              </p>
                              {isUploading && fileProgress[fileIndex] !== undefined ? (
                                <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden w-full max-w-[120px]">
                                  <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${fileProgress[fileIndex]}%` }} />
                                </div>
                              ) : (
                                <p className="text-[10px] text-muted-foreground mt-0.5">{formatBytes(f.size)}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                               <button disabled={isUploading} onClick={() => {
                                 const link = document.createElement("a");
                                 link.href = URL.createObjectURL(f);
                                 link.download = f.name;
                                 link.click();
                               }} className="p-2 hover:bg-emerald-500/10 disabled:opacity-50 hover:text-emerald-600 text-muted-foreground rounded-xl transition-colors" title="Download">
                                 <Download className="w-4 h-4"/>
                               </button>
                               <button disabled={isUploading} onClick={() => {
                                  setSelectedFiles(prev => prev.filter(file => file !== f));
                                  if (filesList.length === 1) setActiveGroup(null);
                               }} className="p-2 hover:bg-rose-500/10 disabled:opacity-50 hover:text-rose-500 text-muted-foreground rounded-xl transition-colors shrink-0" title="Remove"><X className="w-4 h-4"/></button>
                            </div>
                          </div>
                        )});
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

