import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import React, { useRef, useState, useEffect } from "react";
import {
  Lock, Clock, Flame, Eye, Zap, AlertTriangle,
  KeyRound, FileText, MessageSquare, Send, Users,
  ArrowRight, Shield, Sparkles, Link2, Timer,
  Fingerprint, Globe, Heart, ArrowDown
} from "lucide-react";

/* ───── animation variants ───── */

const popIn = {
  hidden: { opacity: 0, scale: 0.5, y: 30 },
  visible: (i: number) => ({
    opacity: 1, scale: 1, y: 0,
    transition: {
      delay: i * 0.08,
      type: "spring" as const,
      stiffness: 260,
      damping: 20,
    },
  }),
};

const slideFromLeft = {
  hidden: { opacity: 0, x: -80 },
  visible: {
    opacity: 1, x: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 18 },
  },
};

const slideFromRight = {
  hidden: { opacity: 0, x: 80 },
  visible: {
    opacity: 1, x: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 18 },
  },
};

const flipUp = {
  hidden: { opacity: 0, rotateX: 60, y: 40 },
  visible: (i: number) => ({
    opacity: 1, rotateX: 0, y: 0,
    transition: {
      delay: i * 0.12,
      type: "spring" as const,
      stiffness: 180,
      damping: 22,
    },
  }),
};

const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

/* ───── reusable section heading ───── */

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      variants={popIn}
      custom={0}
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-body font-semibold mb-4"
    >
      {children}
    </motion.span>
  );
}

/* ───── data ───── */



const features = [
  {
    icon: Lock, title: "Client-Side AES-256-GCM",
    desc: "We use your browser's native Web Crypto API. Content is encrypted before it even hits the network. Our servers only ever receive, store, and serve encrypted noise.",
    tag: "True Zero-Knowledge",
  },
  {
    icon: Clock, title: "Native Auto-Expiry",
    desc: "Powered by database-level TTL (Time to Live). When the expiry timestamp passes, your clip is permanently purged from our infrastructure automatically.",
    tag: "Self-Cleaning",
  },
  {
    icon: Flame, title: "Atomic Data Destruction",
    desc: "With 'Burn After Reading', the encrypted blob and metadata are destroyed in a single atomic database operation the exact millisecond the clip is unlocked.",
    tag: "Burn-After-Read",
  },
  {
    icon: Fingerprint, title: "Serverless Architecture",
    desc: "There are no servers to hack. We use heavily restricted, on-demand cloud functions that execute business logic and instantly vanish.",
    tag: "Minimal Surface",
  },
  {
    icon: Eye, title: "Cryptographic Locks",
    desc: "We use SHA-256 to verify password attempts without ever knowing the password. After 5 incorrect attempts, the clip locks itself cryptographically.",
    tag: "Brute-Force Protected",
  },
  {
    icon: Zap, title: "Anonymous By Default",
    desc: "No accounts, no emails, no cookies. We don't want to know who you are. We just securely transport your encrypted data from point A to point B.",
    tag: "No Tracking",
  },
];

const useCases = [
  { icon: KeyRound, title: "API Keys & Tokens", desc: "Don't leave permanent secrets in chat logs. Share temporary, self-destructing links." },
  { icon: MessageSquare, title: "Private Messages", desc: "Send heavily encrypted notes that vanish after reading. No screenshots, no forwarding." },
  { icon: FileText, title: "Sensitive Documents", desc: "Exchange contracts or financial files via 50MB AES-GCM encrypted payloads." },
  { icon: Send, title: "One-Time Credentials", desc: "Distribute passwords that permanently lock after a single successful decryption." },
  { icon: Users, title: "Team Collaboration", desc: "Share environment variables and deployment keys across teams safely and securely." },
  { icon: Globe, title: "Secure Transport", desc: "Move sensitive data across borders without worrying about intermediate network surveillance." },
];

const trustPoints = [
  "End-to-end encryption (client-side)",
  "No server-side decryption",
  "No access to user data",
  "All data is encrypted in your browser before being sent. The server never sees plaintext content.",
  "We are cryptographically incapable of recovering lost passwords"
];

/* ───── scroll-reactive ambient background ───── */

function AmbientBackground() {
  const { scrollYProgress } = useScroll();
  
  // Drastically increased the scroll travel distances so they really move.
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 1800]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -1400]);
  const y3 = useTransform(scrollYProgress, [0, 1], [-800, 1200]);
  const y4 = useTransform(scrollYProgress, [0, 1], [600, -1000]);

  const x1 = useTransform(scrollYProgress, [0, 1], [0, 600]);
  const x2 = useTransform(scrollYProgress, [0, 1], [0, -800]);
  const x3 = useTransform(scrollYProgress, [0, 1], [-400, 500]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Top Left: Deep Blue (Primary) */}
      <motion.div style={{ y: y1, x: x1 }} className="absolute -top-[10%] -left-[10%] w-[80vw] lg:w-[60vw] h-[80vh] lg:h-[60vh] rounded-full bg-blue-400/30 blur-[140px]" />
      
      {/* Top Right: Vivid Orange/Peach */}
      <motion.div style={{ y: y2, x: x2 }} className="absolute -top-[5%] -right-[15%] w-[80vw] lg:w-[60vw] h-[80vh] lg:h-[60vh] rounded-full bg-orange-400/30 blur-[150px]" />
      
      {/* Middle/Bottom Left: Mint Green */}
      <motion.div style={{ y: y3, x: x3 }} className="absolute top-[35%] -left-[20%] w-[90vw] lg:w-[65vw] h-[90vh] lg:h-[65vh] rounded-full bg-emerald-400/25 blur-[160px]" />
      
      {/* Middle Right: Lavender/Indigo */}
      <motion.div style={{ y: y4, x: x1 }} className="absolute top-[45%] -right-[15%] w-[85vw] lg:w-[65vw] h-[85vh] lg:h-[65vh] rounded-full bg-indigo-400/25 blur-[150px]" />

      {/* Bottom Center: Rose/Pink */}
      <motion.div style={{ y: y1, x: x2 }} className="absolute -bottom-[20%] left-[10%] w-[100vw] lg:w-[75vw] h-[70vh] rounded-full bg-rose-400/25 blur-[140px]" />
    </div>
  );
}

/* ───── main component ───── */


/* ───── interactive jump card ───── */

function ActionCard({ item }: { item: any }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const themeColor = item.textColor.replace('text-', '');

  return (
    <div className={`w-[calc(100%-4.5rem)] ml-auto md:ml-0 md:w-[calc(50%-4rem)]`}>
      <motion.div
        whileHover={{ scale: 1.04, y: -12, rotate: item.align === "left" ? -2 : 2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        onMouseMove={handleMouseMove}
        className={`w-full relative group cursor-pointer`}
      >
        {/* The Card Background */}
        <div className={`absolute inset-0 bg-background/50 backdrop-blur-2xl rounded-[1.5rem] md:rounded-[2rem] border-[2px] border-border/40 shadow-sm group-hover:border-foreground/15 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden`}>
           {/* Smooth, Thicker Mouse Following Spotlight */}
           <motion.div
             className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
             style={{
               background: useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, hsl(var(--${themeColor}) / 0.25), transparent 50%)`,
             }}
           />

           {/* Subtle corner glow instead of distracting flashlight */}
           <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-tr ${item.color} blur-3xl opacity-0 pointer-events-none group-hover:opacity-30 transition-opacity duration-300`} />
           <div className={`absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-gradient-to-tr ${item.color} blur-3xl opacity-10 pointer-events-none group-hover:opacity-30 transition-opacity duration-500`} />
        </div>
        
        {/* Content */}
        <div className="relative z-10 p-6 md:p-8">
          {/* Jumping Icon */}
          <motion.div 
             className={`w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-5 shadow-sm origin-bottom`}
             whileHover={{ rotate: [0, -15, 15, -15, 0], scale: 1.15, y: -5 }}
             transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <item.icon className={`w-6 h-6 ${item.textColor}`} />
          </motion.div>
          
          <h3 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-3 tracking-tight transition-colors duration-300">
             {item.title}
          </h3>
          
          <p className="text-muted-foreground font-body text-sm md:text-base leading-relaxed transition-colors duration-300">
             {item.desc}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ───── flawless gliding mouse followers ───── */

function HeroLock() {
  return (
    <div className="mx-auto w-32 h-32 relative flex justify-center items-center z-10 perspective-[1000px] mb-6">
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        whileHover={{ 
          scale: 1.08, 
          y: -10, 
          rotateY: 15, 
          rotateX: -15, 
          boxShadow: "0 30px 60px -15px rgba(0,0,0,0.3)",
          transition: { type: "spring", stiffness: 300, damping: 15 }
        }}
        whileTap={{ scale: 0.95, rotateY: 0, rotateX: 0 }}
        transition={{ y: { repeat: Infinity, duration: 4.5, ease: "easeInOut" } }}
        className="relative w-28 h-28 bg-gradient-to-tr from-primary via-accent to-success rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.15)] flex items-center justify-center border-[5px] border-background select-none cursor-pointer group"
      >
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-white/20 blur-xl rounded-full pointer-events-none" 
        />
        
        <Lock className="w-12 h-12 text-white relative z-10 drop-shadow-md pointer-events-none transition-transform duration-300 group-hover:scale-110" />
      </motion.div>

      <motion.div 
        animate={{ y: [-6, 6, -6], rotate: [-10, 20, -10], scale: [0.85, 1.15, 0.85], opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
        className="absolute -top-4 -right-4 text-accent pointer-events-none"
      >
        <Sparkles className="w-6 h-6" />
      </motion.div>
      
      <motion.div 
        animate={{ y: [6, -6, 6], rotate: [20, -10, 20], scale: [1.15, 0.85, 1.15], opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-2 -left-4 text-success pointer-events-none"
      >
        <Sparkles className="w-5 h-5" />
      </motion.div>
    </div>
  );
}

function randomSlug() {
  const adj = ["alpha", "swift", "nova", "dark", "silent", "iron", "ghost", "crypto", "zero", "secure"];
  const noun = ["key", "lock", "clip", "vault", "note", "pass", "link", "byte", "drop", "seal"];
  const num = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
  return `${adj[Math.floor(Math.random() * adj.length)]}-${noun[Math.floor(Math.random() * noun.length)]}-${num}`;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  
  // Global scroll for the shrinking header animation
  const { scrollY } = useScroll();
  const navScale = useTransform(scrollY, [0, 300], [1, 0.5]);
  const subtextOpacity = useTransform(scrollY, [0, 150], [1, 0]);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });

  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: timelineProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end center"]
  });
  const lineHeight = useTransform(timelineProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative transition-colors duration-[400ms] ease-in-out">
      <AmbientBackground />
      <div className="absolute top-6 right-6 z-50">
              </div>
      {/* ═══ NAV ═══ */}
      <motion.nav
        style={{ scale: navScale, transformOrigin: "top center" }}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
        className="absolute top-0 left-0 right-0 z-50 pt-10 pb-4 flex flex-col items-center justify-center pointer-events-none theme-cascade-1"
      >
        <div className="flex items-center gap-3 pointer-events-auto cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/favicon.png" alt="clipalpha" className="w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-md select-none" />
          <span className="font-heading text-6xl md:text-[5rem] font-black text-foreground tracking-tighter drop-shadow-sm">
            clipalpha<span className="text-primary">.</span>com
          </span>
        </div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[11px] md:text-xs font-body font-semibold text-muted-foreground/70 tracking-[0.18em] uppercase mt-3 pointer-events-none"
        >
          Privacy by Design, Not by Promise.
        </motion.span>
      </motion.nav>


      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative pt-44 pb-20 md:pt-52 md:pb-32 px-6 overflow-hidden">
        <motion.div
          className="max-w-6xl mx-auto relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 pt-8"
        >
          {/* Left Side: Copy */}
          <div className="flex-1 text-center lg:text-left self-center w-full max-w-2xl mx-auto lg:mx-0">
            <motion.h1
              initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.1 }}
              className="text-6xl md:text-[5rem] lg:text-[6rem] font-heading font-extrabold text-foreground leading-[1.05] tracking-tight theme-cascade-2"
            >
              Your Clipboard,<br/>
              <span className="text-primary">Encrypted.</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.3 }}
              className="mt-8 flex flex-col gap-4 text-left max-w-xl mx-auto lg:mx-0 theme-cascade-3"
            >
              <p className="text-lg md:text-2xl text-muted-foreground font-body leading-relaxed font-light">
                The <strong>secure pastebin</strong> built for privacy. Share text, code, passwords and files with <strong>AES-256 encryption</strong> — right in your browser. No account needed.
              </p>
              <div className="flex flex-col gap-2 border-l-2 border-primary/50 pl-4 mt-2">
                 <span className="text-sm text-foreground/80 font-semibold font-body">✔ End-to-end encryption (client-side)</span>
                 <span className="text-sm text-foreground/80 font-semibold font-body">✔ No server-side decryption possible</span>
                 <span className="text-sm text-foreground/80 font-semibold font-body">✔ Temporary storage (auto-deletes)</span>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Lock + Badge + Button */}
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto lg:mr-8 gap-8 mt-12 lg:mt-0 lg:-translate-y-16 lg:ml-auto">
            
            <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.4 }}
               className="relative w-full flex justify-center theme-cascade-4"
            >
              <motion.img
                src="/favicon.png"
                alt="clipalpha icon"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-32 h-32 md:w-40 md:h-40 rounded-[28%] shadow-[0_30px_80px_-10px_rgba(0,0,0,0.35),0_0_40px_rgba(99,102,241,0.12)] select-none"
              />
            </motion.div>

            {/* BADGE BELOW LOCK */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.5 }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-card/60 backdrop-blur-md border border-border/80 shadow-sm w-full theme-cascade-5"
            >
              <Shield className="w-4 h-4 text-success flex-shrink-0" />
              <span className="text-xs md:text-sm text-foreground/80 font-body font-medium text-center leading-snug">Zero-knowledge encryption — your data stays yours</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.6 }}
              className="flex flex-col items-center gap-3 w-full theme-cascade-6"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -4, boxShadow: "0 20px 40px -10px rgba(74, 144, 226, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/${randomSlug()}`)}
                className="group w-full py-4 md:py-5 rounded-2xl bg-accent text-accent-foreground font-body font-bold text-lg md:text-xl shadow-lg pointer-events-auto flex items-center justify-center gap-3 transition-colors hover:bg-accent/90"
              >
                  Create a clip
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                  </motion.span>
              </motion.button>
              
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-xs md:text-sm text-muted-foreground font-body flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                No login required. Free forever.
              </motion.span>
            </motion.div>
          </div>
        </motion.div>

        {/* Temporary Scroll Indicator */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: [0, 0.8, 0.8, 0] }}
           transition={{ duration: 4.5, times: [0, 0.1, 0.9, 1], ease: "easeInOut", delay: 1 }}
           className="absolute bottom-24 md:bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none"
        >
          <span className="text-sm font-body font-black text-foreground/80 uppercase tracking-[0.2em] drop-shadow-sm text-center">
            Scroll
          </span>
          <motion.div 
            animate={{ y: [0, 15, 0] }} 
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <ArrowDown className="w-12 h-12 text-foreground/80 drop-shadow-sm" strokeWidth={2.5} />
          </motion.div>
        </motion.div>

      </section>

      {/* ═══ HOW TO USE IT (PLAYFUL DYNAMIC) ═══ */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            variants={stagger}
            className="text-center mb-24"
          >
            <SectionTag>
              <Sparkles className="w-4 h-4" /> Quick Start
            </SectionTag>
            <motion.h2
              variants={popIn}
              custom={1}
              className="text-5xl md:text-6xl font-heading font-black text-foreground drop-shadow-sm"
            >
              Ready, set,<br />
              <motion.span
                className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto]"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 4, ease: "linear", repeat: Infinity }}
              >
                Zero-knowledge!
              </motion.span>
            </motion.h2>
          </motion.div>

          {/* Dynamic Scrolling Path */}
          <div ref={timelineRef} className="relative py-10">
            {/* The Track */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-2.5 bg-background border border-border rounded-full -translate-x-1/2 shadow-inner overflow-hidden flex justify-center">
               {/* The Fill */}
               <motion.div 
                 className="absolute top-0 w-full bg-gradient-to-b from-primary via-accent to-success rounded-full origin-top" 
                 style={{ height: lineHeight }}
               />
            </div>

            <div className="space-y-8 md:space-y-12 flex flex-col items-stretch relative z-10">
              {[
                {
                  step: "1",
                  title: "Claim your secure link",
                  desc: "Choose a custom URL like clipalpha.com/keys or get a random secure hash. Absolutely no accounts, emails, or setup required.",
                  icon: Globe,
                  color: "from-primary/40 to-primary/10",
                  textColor: "text-primary",
                  borderColor: "border-primary",
                  align: "left",
                },
                {
                  step: "2",
                  title: "Encrypt text & files",
                  desc: "Client-side AES-GCM encryption for text and files up to 50MB. Set exact expiry timers (5 mins to 30 days) and view limits.",
                  icon: Lock,
                  color: "from-accent/40 to-accent/10",
                  textColor: "text-accent",
                  borderColor: "border-accent",
                  align: "right",
                },
                {
                  step: "3",
                  title: "Share & self-destruct",
                  desc: "Send the link and track its views. Whether it burns after reading or expires in a month, the database mathematically shreds the payload.",
                  icon: Flame,
                  color: "from-success/40 to-success/10",
                  textColor: "text-success",
                  borderColor: "border-success",
                  align: "left",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: false, amount: 0.3 }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className={`relative flex items-center gap-6 md:gap-12 ${
                    item.align === "right" ? "md:flex-row-reverse" : "md:flex-row"
                  }`}
                >
                  {/* Glowing Node on Line */}
                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: false, amount: 0.8 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-background border-[4px] ${item.borderColor} flex items-center justify-center shadow-xl relative overflow-hidden`}
                    >
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className={`absolute inset-0 bg-gradient-to-tr ${item.color} opacity-30`} />
                      <span className={`text-xl md:text-2xl font-heading font-black ${item.textColor} relative z-10`}>{item.step}</span>
                    </motion.div>
                  </div>

                  {/* Sleek Card */}
                  <ActionCard item={item} />

                  {/* Empty Flex Spacer */}
                  <div className="hidden md:block md:w-[calc(50%-4rem)]" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THE PROBLEM ═══ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-60px" }}
            variants={stagger}
            className="text-center"
          >
            <SectionTag>
              <MessageSquare className="w-4 h-4" /> The Problem
            </SectionTag>
            <motion.h2
              variants={popIn}
              custom={1}
              className="text-4xl md:text-5xl font-heading font-bold text-foreground leading-tight"
            >
              You've been sharing secrets<br />the wrong way
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            variants={stagger}
            className="mt-12 space-y-4"
          >
            {[
              "You're trusting centralized servers with data they shouldn't be able to see",
              "You're leaving a permanent trail of passwords and secrets in your chat histories",
              "You're relying on 'secure' platforms that hold both your data and the decryption keys",
              "You're sharing temporary access that eventually turns into permanent security debt",
            ].map((text, i) => (
              <motion.div
                key={i}
                variants={slideFromLeft}
                whileHover={{ x: 8, transition: { type: "spring", stiffness: 300 } }}
                className="bg-card rounded-2xl border border-border p-5 flex items-start gap-4 cursor-default"
              >
                <span className="text-accent text-xl mt-0.5">✗</span>
                <p className="text-foreground font-body">{text}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.3 }}
            className="text-center mt-10 text-lg text-muted-foreground font-body"
          >
            Every one of those creates a permanent record. <strong className="text-foreground">clipalpha</strong> is the alternative.
          </motion.p>
        </div>
      </section>




      {/* ═══ USE CASES ═══ */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            variants={stagger}
            className="text-center mb-16"
          >
            <SectionTag>
              <Timer className="w-4 h-4" /> Use Cases
            </SectionTag>
            <motion.h2
              variants={popIn}
              custom={1}
              className="text-4xl md:text-5xl font-heading font-bold text-foreground"
            >
              One tool. Infinite uses.
            </motion.h2>
            <motion.p
              variants={popIn}
              custom={2}
              className="mt-4 text-lg text-muted-foreground font-body max-w-xl mx-auto"
            >
              Anywhere you'd normally paste sensitive info, clipalpha is the safer choice.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {useCases.map((u, i) => (
              <motion.div
                key={u.title}
                variants={popIn}
                custom={i}
                whileHover={{
                  y: -6,
                  transition: { type: "spring", stiffness: 400 },
                }}
                className="bg-card rounded-2xl border border-border p-6 group cursor-default"
              >
                <div
                  className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-all duration-300 ease-out group-hover:scale-125 group-hover:-rotate-12"
                >
                  <u.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-heading font-bold text-foreground mb-1">{u.title}</h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">{u.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ WHAT MAKES US DIFFERENT ═══ */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            variants={stagger}
            className="text-center mb-16"
          >
            <SectionTag>
              <Sparkles className="w-4 h-4" /> Features
            </SectionTag>
            <motion.h2
              variants={popIn}
              custom={1}
              className="text-4xl md:text-5xl font-heading font-bold text-foreground"
            >
              Built different. By design.
            </motion.h2>
            <motion.p
              variants={popIn}
              custom={2}
              className="mt-4 text-lg text-muted-foreground font-body max-w-xl mx-auto"
            >
              Security isn't a feature we added — it's the foundation everything stands on.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={flipUp}
                custom={i}
                whileHover={{
                  y: -8,
                  boxShadow: "0 20px 40px -12px rgba(0,0,0,0.1)",
                  transition: { type: "spring", stiffness: 300 },
                }}
                className="bg-card rounded-2xl border border-border p-7 group cursor-default"
                style={{ perspective: 600 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div
                    className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center transition-all duration-500 group-hover:bg-primary/20 group-hover:rotate-[360deg] group-hover:scale-110"
                  >
                    <f.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs font-body font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

            {/* ═══ ARCHITECTURE OF TRUST ═══ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            variants={stagger}
            className="text-center mb-16"
          >
            <SectionTag>
              <Shield className="w-4 h-4" /> Architecture of Trust
            </SectionTag>
            <motion.h2
              variants={popIn}
              custom={1}
              className="text-4xl md:text-5xl font-heading font-bold text-foreground"
            >
              The tech that protects you
            </motion.h2>
            <motion.p
              variants={popIn}
              custom={2}
              className="mt-4 text-lg text-muted-foreground font-body max-w-xl mx-auto"
            >
               No proprietary magic — just well-established cryptographic standards that security researchers trust.
            </motion.p>
          </motion.div>

          {/* Merge trust points alert here */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ type: "spring", stiffness: 150, damping: 18 }}
            className="bg-accent/8 border-2 border-accent/25 rounded-2xl p-8 md:p-10 flex gap-5 mb-10 text-left"
          >
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
              <AlertTriangle className="w-8 h-8 text-accent flex-shrink-0 mt-0.5" />
            </motion.div>
            <div>
              <h3 className="text-xl font-heading font-bold text-foreground mb-2">This is important — please read</h3>
              <p className="text-foreground/80 font-body leading-relaxed">
                If you forget your password, <strong>your data is permanently gone</strong>. We don't store your password. We cannot decrypt or recover your content. That's what zero-knowledge means.
              </p>
            </div>
          </motion.div>

          {/* The Tech Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            variants={stagger}
            className="grid sm:grid-cols-2 gap-4 text-left"
          >
            {[
              { label: "Data Encryption", value: "AES-256-GCM", desc: "Authenticates and encrypts. If a single bit is tampered with, decryption outright fails." },
              { label: "Key Derivation", value: "PBKDF2", desc: "310,000 algorithmic iterations with a randomized 16-byte salt to prevent brute-forcing." },
              { label: "Storage Layer", value: "NoSQL + S3", desc: "Encrypted blobs sit in private buckets. Metadata uses DB-level atomic operations." },
              { label: "App Execution", value: "Browser Native", desc: "Zero third-party crypto libraries. We leverage the OS-native Web Crypto API." },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                variants={popIn}
                custom={i}
                whileHover={{ scale: 1.04, transition: { type: "spring", stiffness: 400 } }}
                className="bg-card rounded-2xl border border-border p-5"
              >
                <span className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</span>
                <p className="text-xl font-heading font-bold text-primary mt-1">{item.value}</p>
                <p className="text-sm text-muted-foreground font-body mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust Checkmarks */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            variants={stagger}
            className="grid sm:grid-cols-2 gap-3 mt-10"
          >
            {trustPoints.map((point, i) => (
              <motion.div
                key={i}
                variants={popIn}
                custom={i}
                whileHover={{ x: 8, scale: 1.02, transition: { type: "spring", stiffness: 400 } }}
                className="bg-card rounded-2xl border border-border px-5 py-3.5 flex items-center gap-3 cursor-default"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: false }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: i * 0.08 }}
                  className="w-7 h-7 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0"
                >
                  <span className="text-success font-bold text-xs">✓</span>
                </motion.div>
                <span className="text-foreground font-body text-sm">{point}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
{/* ═══ FINAL CTA ═══ */}
      <section className="py-32 px-6 text-center bg-background relative overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false }}
          variants={stagger}
          className="relative z-10"
        >
          <motion.h2
            variants={popIn}
            custom={0}
            className="text-4xl md:text-6xl font-heading font-bold text-foreground mb-4"
          >
            Ready to share<br />something private?
          </motion.h2>
          <motion.p
            variants={popIn}
            custom={1}
            className="text-lg text-muted-foreground font-body mb-10 max-w-lg mx-auto"
          >
            Instant and encrypted. No signup. No strings.
          </motion.p>
          <motion.button
            variants={popIn}
            custom={2}
            whileHover={{ scale: 1.08, y: -5, boxShadow: "0 25px 50px -12px rgba(74, 144, 226, 0.35)" }}
            whileTap={{ scale: 0.93 }}
            onClick={() => navigate("/start")}
            className="group px-10 py-5 rounded-full bg-primary text-primary-foreground font-body font-bold text-xl shadow-xl"
          >
            <motion.span className="inline-flex items-center gap-3">
              Create a clip
              <motion.span
                animate={{ x: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              >
                <ArrowRight className="w-6 h-6" />
              </motion.span>
            </motion.span>
          </motion.button>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-border py-16 px-6 bg-background relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <motion.span
              whileHover={{ scale: 1.05 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="font-heading text-3xl font-bold text-foreground cursor-pointer tracking-tighter"
            >
              clipalpha<span className="text-primary">.</span>com
            </motion.span>
            <p className="text-sm text-muted-foreground font-body italic">
              Privacy by Design, Not by Promise.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-sm font-body font-semibold uppercase tracking-widest text-muted-foreground/60">
            <motion.a 
              href="https://dashboard.clipalpha.com" 
              target="_blank"
              whileHover={{ color: "hsl(var(--primary))", y: -2 }}
              className="flex items-center gap-2 transition-colors"
            >
              <Zap className="w-4 h-4 text-primary" />
              Live Analytics
            </motion.a>
            <motion.a 
              href="mailto:jvanik06@gmail.com"
              whileHover={{ color: "hsl(var(--foreground))", y: -2 }}
              className="flex items-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Support: jvanik06@gmail.com
            </motion.a>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-muted-foreground/60 font-body uppercase tracking-[0.1em]">
             <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate("/about")}>About</span>
             <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate("/how-it-works")}>How It Works</span>
             <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate("/privacy-policy")}>Privacy Policy</span>
             <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate("/terms")}>Terms</span>
             <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate("/contact")}>Contact</span>
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 text-center md:text-right">
             © 2026 Secure Clipboard & Pastebin Alternative
           </p>
        </div>
      </footer>
    </div>
  );
}
