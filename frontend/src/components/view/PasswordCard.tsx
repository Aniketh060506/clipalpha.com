import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, CheckCheck, Download, Shield, Clock, Eye, Flame,
  Lock, Unlock, FileText, AlertTriangle, FileDown, Image as ImageIcon,
  File as FileIcon, ChevronRight, X, ExternalLink, ChevronLeft, Trash2,
  Code, CheckSquare, Type, Pencil, EyeOff, Paperclip, Loader2, Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CountdownTimer from "./CountdownTimer";
import { StegoEditor } from "../create/RichEditors";
import { getSignedDownloadUrl, extendClip } from "../../utils/api";

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

function formatBytes(bytes?: number, decimals = 1) {
  if (!bytes) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

interface PasswordCardProps {
  content: string;
  meta: ClipMeta;
}

type ViewTab = "text" | "code" | "drawing" | "tasks" | "stego" | "files";

// ─── DrawingRenderer: Fetches S3 drawings via presigned GET URLs (private bucket) ───
function DrawingRenderer({ currentData }: { currentData: string }) {
  const isDataUrl = typeof currentData === 'string' && currentData.startsWith('data:');
  const [blobUrl, setBlobUrl] = useState<string>(isDataUrl ? currentData : '');
  const [loading, setLoading] = useState(!isDataUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (isDataUrl) return;
    let objectUrl = '';
    setLoading(true);
    setFailed(false);

    // Step 1: get a short-lived presigned GET URL from our Lambda
    // Step 2: fetch the actual file from S3 using that signed URL
    getSignedDownloadUrl(currentData)
      .then(({ url }) => fetch(url))
      .then(res => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.blob();
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setFailed(true);
      });
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [currentData]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'shared-drawing.png';
    a.click();
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-body">Loading drawing…</span>
      </div>
    </div>
  );

  if (failed) return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center text-muted-foreground border-2 border-dashed border-border/60 rounded-2xl p-8">
        <span className="text-3xl">🖼️</span>
        <p className="font-bold mt-3">Drawing Unavailable</p>
        <p className="text-sm mt-1">The S3 file may have been deleted or the bucket is private.</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 relative flex items-center justify-center p-6 overflow-auto rounded-b-xl lg:rounded-br-none">
      <div className="absolute top-4 right-6 z-10">
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-body font-bold transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5" /> Download Sketch
        </button>
      </div>
      <img src={blobUrl} alt="Shared sketch" className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] border border-border/40" />
    </div>
  );
}

export default function PasswordCard({ content, meta }: PasswordCardProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // ── Parse content payload ──
  let textContent = content;
  let parsedFiles: Array<{ name: string; type: string; size: number; s3Key?: string; data?: string }> = [];

  if (meta.contentType === "multipart") {
    try {
      const parsed = JSON.parse(content);
      textContent = parsed.text || "";
      parsedFiles = parsed.files || [];
    } catch (_) {}
  }

  const [localFiles, setLocalFiles] = useState(parsedFiles);
  const [loadingFileKey, setLoadingFileKey] = useState<string | null>(null);
  // S3-stored text/code content (new clips store content as files, not inline)
  const [s3TextContent, setS3TextContent] = useState<string | null>(null);
  const [s3CodeContent, setS3CodeContent] = useState<string | null>(null);
  const [s3ContentLoading, setS3ContentLoading] = useState(false);
  // Extend expiry
  const [liveExpiresAt, setLiveExpiresAt] = useState<string | null>(meta.expiresAt);
  const [extendLoading, setExtendLoading] = useState(false);
  const [extendToast, setExtendToast] = useState<string | null>(null);

  const EXTEND_OPTIONS = [
    { label: "+7d",  days: 7,  secs: 7  * 86400 },
    { label: "+15d", days: 15, secs: 15 * 86400 },
    { label: "+30d", days: 30, secs: 30 * 86400 },
    { label: "+50d", days: 50, secs: 50 * 86400 },
  ];

  async function handleExtend(additionalSeconds: number, label: string) {
    if (extendLoading) return;
    try {
      setExtendLoading(true);
      const { newExpiresAt, cappedAt50Days } = await extendClip(meta.slug, additionalSeconds);
      setLiveExpiresAt(newExpiresAt);
      setExtendToast(cappedAt50Days ? "Extended (capped at 50d max)" : `Extended by ${label.replace("+", "")}!`);
      setTimeout(() => setExtendToast(null), 3000);
    } catch (e: any) {
      setExtendToast("Failed to extend — " + (e.message || "try again"));
      setTimeout(() => setExtendToast(null), 3000);
    } finally {
      setExtendLoading(false);
    }
  }

  // ── Resolve a file's fetch URL ───────────────────────────────────────────────
  // Old clips may have inline base64 in f.data — serve directly.
  // New clips have an s3Key — go through the presigned GET Lambda.
  const resolveFileUrl = async (f: { s3Key?: string; data?: string }): Promise<string> => {
    if (f.data) return f.data;                          // legacy: inline base64
    if (f.s3Key) {
      const { url } = await getSignedDownloadUrl(f.s3Key); // presigned GET URL
      return url;
    }
    return "";
  };

  // ── Parse tab format ──
  let format: ViewTab = "text" as ViewTab;
  let tabData: any = textContent;
  let isMulti = false;
  let multiData: Record<string, any> = {};

  if (textContent) {
    try {
      const parsed = JSON.parse(textContent);
      if (parsed && typeof parsed === "object" && parsed.format && parsed.data !== undefined) {
        if (parsed.format === 'multi') {
          isMulti = true;
          multiData = parsed.data || {};
        } else {
          format = parsed.format as ViewTab;
          tabData = parsed.data;
        }
      }
    } catch (_) {}
  }

  // ── Prefetch cache for instant URLs (downloads) ──
  const prefetchedUrls = useRef<Record<string, string>>({});

  // Prefetch presigned download URLs for all S3 files so clicks are instant
  useEffect(() => {
    let active = true;
    (async () => {
      const allFiles: any[] = [];
      if (isMulti) {
        Object.values(multiData).forEach((tab: any) => {
          if (tab && typeof tab === 'object' && tab.type === "file" && tab.s3Key && !tab.data) allFiles.push(tab);
        });
      } else if (format as string === "file" && tabData?.s3Key && !tabData.data) {
        allFiles.push(tabData);
      }
      localFiles.forEach(f => {
        if (f.s3Key && !f.data) allFiles.push(f);
      });
      const uniqueFiles = Array.from(new Map(allFiles.map(f => [f.s3Key, f])).values());
      for (const f of uniqueFiles) {
        if (!active) break;
        if (!prefetchedUrls.current[f.s3Key]) {
          try {
            const { url } = await getSignedDownloadUrl(f.s3Key);
            if (active) prefetchedUrls.current[f.s3Key] = url;
          } catch (e) {
            console.warn("Silent URL prefetch failed for", f.name);
          }
        }
      }
    })();
    return () => { active = false; };
  }, [textContent, localFiles, isMulti, multiData, format, tabData]);

  // Fetch S3-stored text/code content (new clips store all content as files)
  useEffect(() => {
    if (!isMulti) return;
    const textS3  = multiData.text_s3 as string | undefined;
    const codeS3  = multiData.code_s3 as string | undefined;
    if (!textS3 && !codeS3) return;
    setS3ContentLoading(true);
    const tasks: Promise<void>[] = [];
    if (textS3) {
      tasks.push(
        getSignedDownloadUrl(textS3)
          .then(({ url }) => fetch(url))
          .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.text(); })
          .then(t => setS3TextContent(t))
          .catch(() => setS3TextContent('[Could not load text content]'))
      );
    }
    if (codeS3) {
      tasks.push(
        getSignedDownloadUrl(codeS3)
          .then(({ url }) => fetch(url))
          .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.text(); })
          .then(t => setS3CodeContent(t))
          .catch(() => setS3CodeContent('[Could not load code content]'))
      );
    }
    Promise.all(tasks).finally(() => setS3ContentLoading(false));
  }, [isMulti, multiData.text_s3, multiData.code_s3]);

  // Native Handle Download using direct presigned URL
  const handleDownload = async (f: { name: string; s3Key?: string; data?: string }) => {
    const key = f.s3Key ?? f.name;
    try {
      setLoadingFileKey(key);
      let finalUrl = "";
      
      if (f.data) {
        finalUrl = f.data;
      } else if (f.s3Key) {
        if (prefetchedUrls.current[f.s3Key]) {
          finalUrl = prefetchedUrls.current[f.s3Key];
        } else {
          const { url } = await getSignedDownloadUrl(f.s3Key);
          if (url) finalUrl = url;
        }
      }
      
      if (!finalUrl) throw new Error("No URL");

      // Natively hand off to the browser's download manager for progress tracking and concurrency
      const a = document.createElement("a");
      a.href = finalUrl;
      a.download = f.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (err) {
      console.error("Download Error:", err);
      alert("Could not download file. It may have expired or been burned.");
    } finally {
      setLoadingFileKey(null);
    }
  };

  // Open inline natively (generates a specific inline=true URL to stream directly in tab)
  const handleOpen = async (f: { name: string; s3Key?: string; data?: string }) => {
    const key = f.s3Key ?? f.name;
    try {
      setLoadingFileKey(key);
      let finalUrl = "";
      
      if (f.data) {
        finalUrl = f.data;
      } else if (f.s3Key) {
        const { url } = await getSignedDownloadUrl(f.s3Key);
        if (url) finalUrl = url;
      }
      
      if (!finalUrl) throw new Error("No URL");
      
      const newWin = window.open(finalUrl, "_blank", "noopener,noreferrer");
      if (!newWin) alert("Browser blocked the popup. Please allow popups for this site.");
      
    } catch (err) {
      console.error("Open Error:", err);
      alert("This attachment is no longer available. It may have expired or been automatically burned.");
    } finally {
      setLoadingFileKey(null);
    }
  };

  // ── Determine available tabs (only tabs with data + always stego) ──
  const availableTabs = useMemo(() => {
    const tabs: ViewTab[] = [];
    if (isMulti) {
      // Support both inline (legacy) and S3-stored (new) content
      if (multiData.text || multiData.text_s3) tabs.push("text");
      if (multiData.code || multiData.code_s3) tabs.push("code");
      if (multiData.drawing) tabs.push("drawing");
      if (multiData.tasks && multiData.tasks.length > 0) tabs.push("tasks");
    } else {
      if (format === "text" && typeof tabData === "string" && tabData.trim()) tabs.push("text");
      if (format === "code") tabs.push("code");
      if (format === "drawing") tabs.push("drawing");
      if (format === "tasks") tabs.push("tasks");
    }

    // Files tab: show if there are any attached files
    if (localFiles.length > 0) {
      tabs.splice(1, 0, "files");
    }

    tabs.push("stego");
    return tabs;
  }, [format, tabData, isMulti, multiData, localFiles.length]);

  const [activeTab, setActiveTab] = useState<ViewTab>(() => availableTabs[0] ?? "stego");
  const [slideDir, setSlideDir] = useState(1);

  function switchTab(tab: ViewTab) {
    const dir = availableTabs.indexOf(tab) >= availableTabs.indexOf(activeTab) ? 1 : -1;
    setSlideDir(dir);
    setActiveTab(tab);
  }

  // ── Tab config (mirrors CreateWorkspace) ──
  const tabConfig: Record<ViewTab, { label: string; icon: React.ReactNode; activeClass: string }> = {
    text:    { label: "Text",    icon: <Type className="w-3.5 h-3.5" />,        activeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30" },
    code:    { label: "Code",    icon: <Code className="w-3.5 h-3.5" />,        activeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
    drawing: { label: "Drawing", icon: <Pencil className="w-3.5 h-3.5" />,     activeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30" },
    tasks:   { label: "Tasks",   icon: <CheckSquare className="w-3.5 h-3.5" />, activeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30" },
    stego:   { label: "Stego",   icon: <EyeOff className="w-3.5 h-3.5" />,     activeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30" },
    files:   { label: `Files (${localFiles.length})`, icon: <Paperclip className="w-3.5 h-3.5" />, activeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30" },
  };

  // ── Copy / Download ──
  async function handleCopy() {
    let currentData: any = isMulti ? multiData[activeTab] : tabData;
    // For S3-stored content, use the fetched string
    if (isMulti && activeTab === 'text') currentData = s3TextContent ?? multiData.text;
    if (isMulti && activeTab === 'code') currentData = s3CodeContent ?? multiData.code;
    const text = typeof currentData === "string" ? currentData : JSON.stringify(currentData, null, 2);
    await navigator.clipboard.writeText(text ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // ── File groups ──
  const groups = useMemo(() => {
    const out: Record<string, typeof localFiles> = { all: localFiles, images: [], pdfs: [] };
    localFiles.forEach(f => {
      if (f.type.startsWith("image/")) out.images.push(f);
      else if (f.type === "application/pdf") out.pdfs.push(f);
      else {
        const ext = (f.name.match(/\.([^.]+)$/)?.[1] ?? "bin").toLowerCase();
        if (!out[ext]) out[ext] = [];
        out[ext].push(f);
      }
    });
    return out;
  }, [localFiles]);

  // ── Render tab content ──
  const renderContent = () => {
    if (activeTab === "stego") return <StegoEditor />;

    // Resolve current data — S3-fetched content takes priority for text/code tabs
    let currentData: any = isMulti ? multiData[activeTab] : tabData;
    if (isMulti && activeTab === 'text') currentData = s3TextContent ?? multiData.text;
    if (isMulti && activeTab === 'code') currentData = s3CodeContent ?? multiData.code;

    // Show spinner while fetching S3 content
    const isS3Tab = isMulti && ((activeTab === 'text' && multiData.text_s3) || (activeTab === 'code' && multiData.code_s3));
    if (isS3Tab && s3ContentLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-body">Loading content…</span>
          </div>
        </div>
      );
    }

    if (activeTab === "code") {
      return (
        <div className="flex-1 relative overflow-hidden flex flex-col bg-card rounded-b-xl group">
          <button
            onClick={() => {
              if (typeof currentData === "string") navigator.clipboard.writeText(currentData);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold font-body hover:bg-emerald-500/20 transition-all opacity-0 group-hover:opacity-100"
          >
            {copied
              ? <><CheckCheck className="w-3.5 h-3.5" /> Copied!</>
              : <><Copy className="w-3.5 h-3.5" /> Copy</>
            }
          </button>
          <pre className="flex-1 font-mono text-[14px] text-emerald-400 p-6 whitespace-pre-wrap break-all leading-relaxed overflow-y-auto custom-scrollbar">
            {typeof currentData === 'string' ? currentData : ''}
          </pre>
        </div>
      );
    }

    if (activeTab === "drawing") {
      return <DrawingRenderer currentData={currentData} />;
    }

    if (activeTab === "tasks") {
      const tasks = currentData as Array<{ id: string; text: string; done: boolean }>;
      return (
        <div className="flex-1 p-6 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          {(!tasks || tasks.length === 0) && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground/50 border-2 border-dashed border-border/60 rounded-xl">
              <p className="text-sm font-bold">No tasks</p>
            </div>
          )}
          {tasks && tasks.map((t, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-background border border-border/80 shadow-sm rounded-xl">
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${t.done ? "bg-indigo-500 border-indigo-500 text-white" : "border-border/80"}`}>
                <CheckCheck className={`w-4 h-4 ${t.done ? "opacity-100" : "opacity-0"}`} />
              </div>
              <span className={`flex-1 text-sm font-semibold ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.text}</span>
            </div>
          ))}
        </div>
      );
    }

    // Text (default)
    return (
      <div className="flex-1 relative p-6 flex flex-col overflow-hidden">
        <pre className="flex-1 font-mono text-[15px] font-medium leading-relaxed whitespace-pre-wrap break-words text-foreground bg-transparent focus:outline-none custom-scrollbar overflow-auto mt-2 lg:mt-0">
          {typeof currentData === "string" ? currentData : ""}
        </pre>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">

      {/* ── Top Nav ── */}
      <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between px-3 md:px-5 py-2 bg-background/80 backdrop-blur-md z-40 border-b border-border/40 theme-cascade-1 gap-2 md:gap-4">
        {/* Row 1: logo + copy button */}
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 font-heading text-base font-black text-foreground tracking-tight hover:opacity-70 transition-opacity shrink-0">
            <img src="/favicon.png" alt="clipalpha" className="w-6 h-6 rounded-md select-none" />
            clip<span className="text-primary">alpha</span>
          </button>

          {/* Copy button — always visible on mobile in top row */}
          {activeTab !== "stego" && (
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={handleCopy}
              className="flex md:hidden items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background font-body font-bold text-sm theme-cascade-3"
            >
              <AnimatePresence mode="wait">
                {copied
                  ? <motion.span key="done" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5"><CheckCheck className="w-4 h-4" /> Copied!</motion.span>
                  : <motion.span key="copy" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5"><Copy className="w-4 h-4" /> Copy</motion.span>}
              </AnimatePresence>
            </motion.button>
          )}
        </div>

        {/* Row 2 (mobile) / middle (desktop): scrollable meta badges */}
        <div className="flex items-center gap-2 flex-nowrap overflow-x-auto hide-scrollbars theme-cascade-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/25 shrink-0">
            <Shield className="w-3 h-3" /> Decrypted
          </span>
          {liveExpiresAt && (
            <>
              <span
                title={`Deletes permanently on: ${new Date(liveExpiresAt).toLocaleString()}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/25 cursor-help shrink-0"
              >
                <Clock className="w-3 h-3" /><CountdownTimer expiresAt={liveExpiresAt} compact />
              </span>
              {/* Extend pills — hidden for burn-after-read */}
              {!meta.burnAfterRead && (
                <div className="flex items-center gap-1 shrink-0">
                  {EXTEND_OPTIONS.map(opt => (
                    <motion.button
                      key={opt.label}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => handleExtend(opt.secs, opt.label)}
                      disabled={extendLoading}
                      title={`Add ${opt.days} days to expiry`}
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border border-primary/30 bg-primary/8 text-primary hover:bg-primary/15 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {extendLoading
                        ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        : <Plus className="w-2.5 h-2.5" />}
                      {opt.label.replace("+", "")}
                    </motion.button>
                  ))}
                </div>
              )}
            </>
          )}
          {/* Extend toast */}
          <AnimatePresence>
            {extendToast && (
              <motion.span
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/25 shrink-0"
              >
                ✓ {extendToast}
              </motion.span>
            )}
          </AnimatePresence>
          {meta.burnAfterRead && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold border border-accent/25 shrink-0">
              <Flame className="w-3 h-3" /> Burned Once
            </span>
          )}
          {(meta.viewsRemaining !== null || meta.viewCount !== undefined) && (
            <span
              title={[meta.viewCount !== undefined ? `Total Views: ${meta.viewCount}` : null, meta.viewLimit !== undefined ? `Maximum Limit: ${meta.viewLimit}` : null].filter(Boolean).join(" | ") || "View Tracking"}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 text-xs font-bold border border-indigo-500/25 cursor-help shrink-0"
            >
              <Eye className="w-3 h-3" />
              {meta.viewsRemaining !== null ? `${meta.viewsRemaining} left` : `${meta.viewCount} views`}
            </span>
          )}
          {meta.burnAfterRead && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 text-xs font-bold border border-amber-500/25 animate-pulse shrink-0">
              <AlertTriangle className="w-3 h-3" /> Copy now!
            </span>
          )}
        </div>

        {/* Desktop-only copy button */}
        {activeTab !== "stego" && (
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={handleCopy}
            className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background font-body font-bold text-sm theme-cascade-3"
          >
            <AnimatePresence mode="wait">
              {copied
                ? <motion.span key="done" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5"><CheckCheck className="w-4 h-4" /> Copied!</motion.span>
                : <motion.span key="copy" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5"><Copy className="w-4 h-4" /> Copy</motion.span>}
            </AnimatePresence>
          </motion.button>
        )}
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 w-full px-3 md:px-5 py-2 pb-5 flex flex-col min-h-[85vh] md:min-h-0">
        <div className="flex-1 flex flex-col lg:flex-row relative rounded-2xl border border-border bg-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] overflow-hidden min-h-[85vh] md:min-h-0 theme-cascade-4">

          {/* Left: Tab Content */}
          <div className={`flex flex-col relative border-b-4 lg:border-b-0 lg:border-r-4 border-border/60 min-h-0 transition-all ${activeTab === 'files' ? 'flex-none border-b-0 lg:border-b-4 lg:flex-1' : 'flex-1 min-h-[300px] lg:min-h-0'}`}>

            {/* Tabs — icon-only on mobile, icon+label on desktop */}
            <div className="flex items-center gap-1 md:gap-1.5 border-b-2 border-border/40 px-3 md:px-4 py-2 md:py-2.5 bg-muted/10 overflow-x-auto hide-scrollbars">
              {availableTabs.map(tab => {
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
                        layoutId="view-tab-bg"
                        className={`absolute inset-0 rounded-xl ${cfg.activeClass} shadow-sm`}
                        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {cfg.icon}
                      <span className="hidden md:inline tracking-wide">{cfg.label}</span>
                    </span>
                  </motion.button>
                );
              })}
              
              {/* Character Count & Copy Button for Text/Code Tabs moved here */}
              {(activeTab === "text" || activeTab === "code") && (
                <div className="ml-auto flex items-center gap-3 pl-4 shrink-0 pr-1">
                  {typeof (isMulti ? multiData[activeTab] : tabData) === "string" && (isMulti ? multiData[activeTab] : tabData).length > 0 && (
                    <span className="text-[11px] font-mono font-bold text-muted-foreground/60 pointer-events-none hidden sm:inline-block">
                      {(isMulti ? multiData[activeTab] : tabData).length.toLocaleString()} chars
                    </span>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-foreground/10 hover:bg-foreground/20 text-foreground text-[11px] font-body font-bold transition-all drop-shadow-sm"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.span key="done" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Copied!</span>
                        </motion.span>
                      ) : (
                        <motion.span key="copy" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                          <Copy className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Copy</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              )}
            </div>

            {/* Content */}
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
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            {activeTab !== "stego" && (
              <div className={`p-4 px-6 border-t border-border/30 items-center gap-2 pointer-events-none opacity-50 shrink-0 ${activeTab === 'files' ? 'hidden lg:flex' : 'flex'}`}>
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-body text-muted-foreground font-semibold tracking-wide uppercase">Decrypted in browser · AES-256-GCM</span>
              </div>
            )}
          </div>

          {/* Right: File Panel */}
          <div className={`lg:w-[320px] flex-shrink-0 flex-col relative overflow-hidden min-h-0 ${activeTab === 'files' ? 'flex-1 w-full flex' : 'hidden lg:flex w-full'}`}>
            <AnimatePresence mode="wait">
              {!activeGroup ? (
                <motion.div key="buckets" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 p-6 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4 shrink-0">
                    <div className="p-2 rounded-xl bg-background border-2 border-border shadow-sm text-foreground">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <span className="font-body font-bold text-[14px] tracking-tight text-foreground">Attachments</span>
                  </div>

                  {localFiles.length === 0 ? (
                    <div className="flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 border-border/80 bg-background/50 min-h-[200px]">
                      <FileDown className="w-6 h-6 text-muted-foreground/40" />
                      <p className="text-sm font-bold text-muted-foreground/60">No attachments</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar gap-3 pb-4">
                      {/* All files */}
                      <button onClick={() => setActiveGroup("all")} className="w-full p-4 bg-background border border-border shadow-sm rounded-2xl flex items-center justify-between hover:bg-muted/50 transition-all hover:scale-[1.02]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0"><Paperclip className="w-5 h-5" /></div>
                          <div className="text-left"><p className="text-sm font-bold text-foreground">All Files</p><p className="text-[10px] text-muted-foreground">{localFiles.length} total</p></div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {groups.images.length > 0 && (
                        <button onClick={() => setActiveGroup("images")} className="p-4 bg-background border border-border shadow-sm rounded-2xl flex items-center justify-between hover:bg-muted/50 transition-all hover:scale-[1.02]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0"><ImageIcon className="w-5 h-5" /></div>
                            <div className="text-left"><p className="text-sm font-bold">Images</p><p className="text-[10px] text-muted-foreground">{groups.images.length} files</p></div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                      {groups.pdfs.length > 0 && (
                        <button onClick={() => setActiveGroup("pdfs")} className="p-4 bg-background border border-border shadow-sm rounded-2xl flex items-center justify-between hover:bg-muted/50 transition-all hover:scale-[1.02]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></div>
                            <div className="text-left"><p className="text-sm font-bold">PDFs</p><p className="text-[10px] text-muted-foreground">{groups.pdfs.length} files</p></div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                      {Object.entries(groups).map(([ext, files]) => {
                        if (["all", "images", "pdfs"].includes(ext) || files.length === 0) return null;
                        return (
                          <button key={ext} onClick={() => setActiveGroup(ext)} className="p-4 bg-background border border-border shadow-sm rounded-2xl flex items-center justify-between hover:bg-muted/50 transition-all hover:scale-[1.02]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0"><FileIcon className="w-5 h-5" /></div>
                              <div className="text-left"><p className="text-sm font-bold uppercase">.{ext}</p><p className="text-[10px] text-muted-foreground">{files.length} files</p></div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="files" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 p-6 flex flex-col h-full bg-background/50">
                  
                  <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveGroup(null)} className="p-2 -ml-2 hover:bg-muted/80 rounded-xl transition-colors text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="font-body font-bold text-[14px] uppercase text-foreground">
                        {activeGroup === "all" ? "All Files" : activeGroup === "images" ? "Images" : activeGroup === "pdfs" ? "PDFs" : activeGroup}
                      </span>
                    </div>
                    {(() => {
                      const list = activeGroup === "all" ? localFiles
                        : activeGroup === "images" ? localFiles.filter(f => f.type.startsWith("image/"))
                        : activeGroup === "pdfs" ? localFiles.filter(f => f.type === "application/pdf")
                        : localFiles.filter(f => (f.name.match(/\.([^.]+)$/)?.[1] ?? "bin").toLowerCase() === activeGroup);
                      return list.length > 1 ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => list.forEach((f, idx) => setTimeout(() => {
                            handleDownload(f);
                          }, idx * 500))} className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 rounded-xl transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pb-4">
                    {(() => {
                      const list = activeGroup === "all" ? localFiles
                        : activeGroup === "images" ? localFiles.filter(f => f.type.startsWith("image/"))
                        : activeGroup === "pdfs" ? localFiles.filter(f => f.type === "application/pdf")
                        : localFiles.filter(f => (f.name.match(/\.([^.]+)$/)?.[1] ?? "bin").toLowerCase() === activeGroup);
                      return list.map((f, i) => {
                        const fileKey = f.s3Key ?? f.name;
                        const isLoading = loadingFileKey === fileKey;
                        return (
                          <div
                            key={i}
                            className={`relative flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 overflow-hidden
                              ${isLoading
                                ? "border-primary/40 bg-primary/5"
                                : "border-border/60 bg-background hover:bg-muted/30 hover:border-border"}`}
                          >
                            {/* Shimmer bar when loading */}
                            {isLoading && (
                              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                              </div>
                            )}

                            {/* File icon */}
                            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200
                              ${isLoading ? "bg-primary/15" : "bg-muted/60"}`}>
                              {isLoading
                                ? <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                : <FileIcon className="w-5 h-5 text-muted-foreground" />}
                            </div>

                            {/* File info */}
                            <div className="flex-1 min-w-0">
                              <p
                                onClick={() => !isLoading && handleOpen(f)}
                                className={`text-sm font-semibold truncate transition-colors duration-200
                                  ${isLoading
                                    ? "text-primary"
                                    : "text-foreground hover:text-indigo-500 cursor-pointer"}`}
                              >
                                {f.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {isLoading ? (
                                  <span className="flex items-center gap-1 text-primary/70 font-medium">
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    Preparing link…
                                  </span>
                                ) : formatBytes(f.size)}
                              </p>
                            </div>

                            {/* Action buttons — larger tap targets on mobile */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleOpen(f)}
                                disabled={isLoading}
                                title="Open in new tab"
                                className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-all duration-200
                                  ${isLoading
                                    ? "opacity-40 cursor-not-allowed"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95"}`}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownload(f)}
                                disabled={isLoading}
                                title="Download"
                                className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-all duration-200
                                  ${isLoading
                                    ? "opacity-40 cursor-not-allowed"
                                    : "hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 active:scale-95"}`}
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      });
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
