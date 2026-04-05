import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { getClip } from "../utils/api";
import ViewScreen from "../components/view/ViewScreen";
import CreateWorkspace from "../components/create/CreateWorkspace";
import { Lock, Loader2, AlertCircle } from "lucide-react";

/* ───── shared ambient background (mirrored from LandingPage) ───── */
function AmbientBackground() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 1800]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -1400]);
  const y3 = useTransform(scrollYProgress, [0, 1], [-800, 1200]);
  const y4 = useTransform(scrollYProgress, [0, 1], [600, -1000]);
  const x1 = useTransform(scrollYProgress, [0, 1], [0, 600]);
  const x2 = useTransform(scrollYProgress, [0, 1], [0, -800]);
  const x3 = useTransform(scrollYProgress, [0, 1], [-400, 500]);
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <motion.div style={{ y: y1, x: x1 }} className="absolute -top-[10%] -left-[10%] w-[80vw] lg:w-[60vw] h-[80vh] lg:h-[60vh] rounded-full bg-blue-400/30 blur-[140px]" />
      <motion.div style={{ y: y2, x: x2 }} className="absolute -top-[5%] -right-[15%] w-[80vw] lg:w-[60vw] h-[80vh] lg:h-[60vh] rounded-full bg-orange-400/30 blur-[150px]" />
      <motion.div style={{ y: y3, x: x3 }} className="absolute top-[35%] -left-[20%] w-[90vw] lg:w-[65vw] h-[90vh] lg:h-[65vh] rounded-full bg-emerald-400/25 blur-[160px]" />
      <motion.div style={{ y: y4, x: x1 }} className="absolute top-[45%] -right-[15%] w-[85vw] lg:w-[65vw] h-[85vh] lg:h-[65vh] rounded-full bg-indigo-400/25 blur-[150px]" />
      <motion.div style={{ y: y1, x: x2 }} className="absolute -bottom-[20%] left-[10%] w-[100vw] lg:w-[75vw] h-[70vh] rounded-full bg-rose-400/25 blur-[140px]" />
    </div>
  );
}

/* ───── loading state ───── */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-background transition-colors duration-[400ms] ease-in-out">
      <AmbientBackground />
      <div className="absolute top-6 right-6 z-50">
              </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative z-10 flex flex-col items-center gap-6 theme-cascade-1"
      >
        <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-tr from-primary via-accent to-emerald-500 flex items-center justify-center shadow-[0_20px_60px_-15px_rgba(74,144,226,0.5)]">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
            <Loader2 className="w-9 h-9 text-white" />
          </motion.div>
        </div>
        <div className="text-center">
          <p className="font-heading text-2xl font-bold text-foreground">Checking clip…</p>
          <p className="text-muted-foreground font-body text-sm mt-1">Fetching encrypted payload</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ───── error state ───── */
function ErrorScreen({ message }: { message: string }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-background transition-colors duration-[400ms] ease-in-out px-6">
      <AmbientBackground />
      <div className="absolute top-6 right-6 z-50">
              </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative z-10 text-center max-w-md theme-cascade-1"
      >
        <div className="w-20 h-20 rounded-[1.5rem] bg-accent/15 border-2 border-accent/30 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-9 h-9 text-accent" />
        </div>
        <h2 className="font-heading text-3xl font-bold text-foreground mb-2">Something went wrong</h2>
        <p className="text-muted-foreground font-body mb-8">{message}</p>
        <button
          onClick={() => navigate("/")}
          className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-body font-semibold hover:bg-primary/90 transition-colors"
        >
          Back to Home
        </button>
      </motion.div>
    </div>
  );
}

/* ───── main SlugPage controller ───── */
type PageState = "loading" | "create" | "view" | "error";

interface ClipMeta {
  slug: string;
  hasPassword: boolean;
  expiresAt: string | null;
  burnAfterRead: boolean;
  viewsRemaining: number | null;
  contentType: "text" | "file";
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  viewCount?: number;
  viewLimit?: number;
}

export default function SlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const [state, setState] = useState<PageState>("loading");
  const [clipMeta, setClipMeta] = useState<ClipMeta | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!slug) { setState("error"); setErrorMsg("No slug provided."); return; }

    getClip(slug)
      .then((data) => {
        setClipMeta({
          slug,
          hasPassword: data.hasPassword ?? false,
          expiresAt: data.expiresAt ?? null,
          burnAfterRead: data.burnAfterRead ?? false,
          viewsRemaining: data.viewsRemaining ?? null,
          viewCount: data.viewCount,
          viewLimit: data.viewLimit,
          contentType: data.contentType ?? "text",
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileMimeType: data.fileMimeType,
        });
        setState("view");
      })
      .catch((err) => {
        if (err?.status === 404) {
          // No clip at this slug → show Create mode
          setState("create");
        } else {
          setErrorMsg(err?.message || "An unexpected error occurred.");
          setState("error");
        }
      });
  }, [slug]);

  if (state === "loading") return <LoadingScreen />;
  if (state === "error")   return <ErrorScreen message={errorMsg} />;
  if (state === "view" && clipMeta) return <ViewScreen meta={clipMeta} />;
  if (state === "create")  return <CreateWorkspace slug={slug!} />;

  return null;
}
