import { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { motion, useAnimation } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [isOn, setIsOn] = useState(!isDark);
  const swingControls = useAnimation();
  const didDrag = useRef(false);
  const dragStartX = useRef(0);
  // Full-width constraint rail — bulb can slide between left and right edges
  const constraintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsOn(!isDark);
  }, [isDark]);

  const toggleBulb = () => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    if (!isOn) {
      setIsOn(true);
      setTheme("light");
    } else {
      setIsOn(false);
      setTheme("dark");
    }
    swingControls.start({
      rotate: [0, 18, -13, 8, -4, 2, 0],
      transition: { duration: 1.8, ease: "easeInOut" }
    });
  };

  return (
    <>
      {/* Invisible full-width rail that defines the drag boundary */}
      <div
        ref={constraintRef}
        className="fixed top-0 left-4 right-4 h-1 z-[99] pointer-events-none"
      />

      {/* Bulb — positioned near right, can slide the full rail width */}
      <div className="fixed top-0 right-[140px] md:right-[200px] z-[100] pointer-events-none">
        <motion.div
          drag="x"
          dragConstraints={constraintRef}
          dragElastic={0.08}
          dragMomentum={true}
          dragTransition={{ bounceStiffness: 180, bounceDamping: 24, power: 0.3, timeConstant: 240 }}
          onDragStart={(_e: any, info: any) => {
            didDrag.current = false;
            dragStartX.current = info.point.x;
          }}
          onDrag={(_e: any, info: any) => {
            if (Math.abs(info.point.x - dragStartX.current) > 5) {
              didDrag.current = true;
            }
          }}
          whileDrag={{ cursor: "grabbing" }}
          className="flex flex-col items-center cursor-grab pointer-events-auto"
          onClick={toggleBulb}
          style={{ transformOrigin: "top center" }}
        >
        {/* Swing wrapper — rotates on click, anchored at top */}
        <motion.div
          animate={swingControls}
          style={{ transformOrigin: "top center" }}
          whileHover={{ rotate: 6, transition: { type: "spring", stiffness: 260, damping: 18 } }}
          className="flex flex-col items-center"
        >
          {/* Wire */}
          <div className="w-[3px] h-6 bg-gradient-to-b from-slate-500 to-slate-400 dark:from-zinc-700 dark:to-zinc-600 shadow-[1px_0_3px_rgba(0,0,0,0.12)] relative z-0" />

          {/* Bulb Base socket */}
          <div className="w-6 h-5 bg-gradient-to-b from-slate-700 to-slate-600 dark:from-zinc-800 dark:to-zinc-700 rounded-b border-b-2 border-slate-900/60 z-10 relative shadow-[0_2px_10px_rgba(0,0,0,0.3)] flex flex-col justify-evenly px-0.5">
            <div className="w-full h-[1px] bg-slate-900/40 rounded-full" />
            <div className="w-full h-[1px] bg-slate-900/40 rounded-full" />
            <div className="w-full h-[1px] bg-slate-900/40 rounded-full" />
          </div>

          {/* The Hanging Glass Bulb */}
          <div
            className={`relative w-12 h-12 rounded-full -mt-2 z-20 flex items-center justify-center transition-all duration-500
              ${isOn
                ? "bg-gradient-to-br from-yellow-100 via-yellow-200 to-blue-100 shadow-[0_0_40px_15px_rgba(253,230,138,0.7),inset_0_-4px_10px_rgba(0,0,0,0.1)] scale-[1.05]"
                : "bg-gradient-to-br from-slate-200 to-slate-400 dark:from-zinc-700 dark:to-zinc-900 shadow-[0_4px_10px_rgba(0,0,0,0.2),inset_0_-6px_15px_rgba(0,0,0,0.4)] scale-100"
              }`}
          >
            {/* Outer Halo Glow */}
            <div
              className={`absolute inset-0 rounded-full mix-blend-screen blur-md transition-opacity duration-500
                ${isOn ? "opacity-90 bg-gradient-to-br from-yellow-300 to-blue-200" : "opacity-0"}`}
            />
            {/* Inner Filament Loop */}
            <div
              className={`relative z-10 w-4 h-5 border-[2px] rounded-full border-b-0 rounded-b-none flex flex-col items-center justify-end max-w-full overflow-visible
                ${isOn ? "border-amber-400/90 shadow-[0_0_12px_rgba(217,119,6,1)]" : "border-slate-500/80 dark:border-zinc-500/80"}`}
            >
              <div className={`w-[2px] h-[6px] ${isOn ? "bg-amber-400" : "bg-slate-500 dark:bg-zinc-500"} absolute -bottom-[6px] -left-1 rotate-[20deg] rounded-full`} />
              <div className={`w-[2px] h-[6px] ${isOn ? "bg-amber-400" : "bg-slate-500 dark:bg-zinc-500"} absolute -bottom-[6px] -right-1 -rotate-[20deg] rounded-full`} />
            </div>
            {/* Glare */}
            <div className="absolute top-[10%] left-[15%] w-[35%] h-[25%] bg-white/70 blur-[1px] rounded-full rotate-[-30deg]" />
          </div>
        </motion.div>
      </motion.div>
      </div>
    </>
  );
}
