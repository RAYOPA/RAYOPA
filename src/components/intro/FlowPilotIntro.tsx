"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

/* ─────────────────────────────────────────────────
   EASING PRESETS & THEME
───────────────────────────────────────────────── */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_IN_OUT_CIRC = [0.85, 0, 0.15, 1] as const;
const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;

/* ─────────────────────────────────────────────────
   SMALL SVG ICONS (inline, zero-dependency)
───────────────────────────────────────────────── */
const IconAI = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth={1.5}>
    <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5V11h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1v1a3 3 0 0 1-6 0v-1H7a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2V9.5C7.8 8.8 7 7.5 7 6a4 4 0 0 1 4-4z" />
    <circle cx="9" cy="14" r="1" fill="currentColor" />
    <circle cx="15" cy="14" r="1" fill="currentColor" />
  </svg>
);

const IconWorkflow = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

const IconLightning = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

/* ─────────────────────────────────────────────────
   BACKGROUND LAYER
───────────────────────────────────────────────── */
const BackgroundLayer: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <style>{`
      @keyframes intro-gradient-xy {
        0%, 100% { background-size: 400% 400%; background-position: left center; }
        50% { background-size: 200% 200%; background-position: right center; }
      }
      .intro-animate-gradient {
        animation: intro-gradient-xy 8s ease-in-out infinite;
      }
    `}</style>
    <div
      className="absolute inset-0 intro-animate-gradient"
      style={{
        backgroundImage: "linear-gradient(-45deg, #f59e0b, #d946ef, #8b5cf6, #3b82f6)",
      }}
    />
    <div className="absolute inset-0 bg-black/10 mix-blend-overlay backdrop-blur-[100px]" />
    
    {/* Floating blurred orbs for extra depth */}
    <motion.div 
      className="absolute w-[40vw] h-[40vw] rounded-full mix-blend-overlay opacity-30"
      style={{ background: "#ffffff", top: "-10%", right: "-10%", filter: "blur(100px)" }}
      animate={{ scale: [1, 1.2, 1], x: [0, -50, 0] }}
      transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
    />
    <motion.div 
      className="absolute w-[50vw] h-[50vw] rounded-full mix-blend-overlay opacity-20"
      style={{ background: "#ffffff", bottom: "-20%", left: "-10%", filter: "blur(120px)" }}
      animate={{ scale: [1, 1.3, 1], y: [0, -50, 0] }}
      transition={{ duration: 7, ease: "easeInOut", repeat: Infinity, delay: 1 }}
    />
  </div>
);

/* ─────────────────────────────────────────────────
   SCENE 01 — FLUID BRAND REVEAL
───────────────────────────────────────────────── */
const SceneBrandReveal: React.FC = () => (
  <div className="flex flex-col items-center justify-center w-full h-full text-center select-none px-4 relative z-10">
    <motion.div
      className="flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/40 shadow-2xl mb-8"
      initial={{ scale: 0, rotate: -45, borderRadius: "50%" }}
      animate={{ scale: 1, rotate: 0, borderRadius: "24px" }}
      transition={{ duration: 1.2, ease: EASE_OUT_EXPO }}
    >
      <div className="w-12 h-12 sm:w-16 sm:h-16 text-white drop-shadow-md">
        <IconAI />
      </div>
    </motion.div>

    <div className="overflow-hidden p-2">
      <motion.span
        className="block font-black tracking-tighter text-white leading-none drop-shadow-xl"
        style={{ fontSize: "clamp(36px, 8vw, 90px)" }}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3, ease: EASE_OUT_EXPO }}
      >
        FLOWPILOT
      </motion.span>
    </div>
    
    <motion.p
      className="mt-6 text-sm sm:text-base text-white/90 font-medium tracking-[0.2em] uppercase"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.5, delay: 0.8 }}
    >
      The Future of Work
    </motion.p>
  </div>
);

/* ─────────────────────────────────────────────────
   SCENE 02 — KINETIC TYPOGRAPHY
───────────────────────────────────────────────── */
const SceneKinetic: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full text-center select-none px-4 z-10">
      <div className="flex flex-col items-center gap-4 w-full max-w-5xl">
        <motion.div
          className="font-black text-white/90 tracking-tighter leading-none uppercase drop-shadow-lg w-full"
          style={{ fontSize: "clamp(32px, 7vw, 80px)" }}
          initial={{ x: -60, opacity: 0, skewX: -10 }}
          animate={{ x: 0, opacity: 1, skewX: 0 }}
          transition={{ duration: 1.0, ease: EASE_OUT_EXPO }}
        >
          BUSINESS
        </motion.div>
        
        <motion.div
          className="font-black text-white tracking-tighter leading-none uppercase drop-shadow-lg w-full"
          style={{ fontSize: "clamp(32px, 7vw, 80px)" }}
          initial={{ x: 60, opacity: 0, skewX: 10 }}
          animate={{ x: 0, opacity: 1, skewX: 0 }}
          transition={{ duration: 1.0, delay: 0.2, ease: EASE_OUT_EXPO }}
        >
          INTENT
        </motion.div>
        
        <motion.div
          className="my-6 flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xl"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <IconLightning />
        </motion.div>
        
        <div className="overflow-hidden w-full p-2">
          <motion.div
            className="font-black text-white tracking-tighter leading-none uppercase drop-shadow-2xl w-full"
            style={{ fontSize: "clamp(40px, 9vw, 100px)" }}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.9, ease: EASE_OUT_EXPO }}
          >
            ACTION
          </motion.div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────
   SCENE 03 — GLASSMORPHISM WORKFLOW
───────────────────────────────────────────────── */
const SceneGlassWorkflow: React.FC = () => {
  const cards = ["Trigger", "Analyze", "Extract", "Format", "Deliver"];
  
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full select-none overflow-hidden px-4 z-10">
      <motion.div
        className="font-black text-white/90 uppercase tracking-widest text-sm sm:text-xl mb-12 drop-shadow-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Autonomous Orchestration
      </motion.div>
      
      <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 max-w-4xl px-2">
        {cards.map((card, i) => (
          <React.Fragment key={card}>
            <motion.div
              className="flex items-center justify-center px-4 py-3 sm:px-6 sm:py-4 bg-white/10 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl text-white font-bold tracking-wide flex-shrink-0"
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.25, duration: 0.9, ease: EASE_OUT_EXPO }}
            >
              {card}
            </motion.div>
            {i < cards.length - 1 && (
              <motion.div
                className="hidden md:block text-white/70"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (i * 0.25) + 0.15, duration: 0.5 }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────
   OUTRO — SEAMLESS TRANSITION
───────────────────────────────────────────────── */
const SceneOutro: React.FC = () => (
  <div className="flex flex-col items-center justify-center w-full h-full text-center px-4 select-none z-10">
    <motion.div
      className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white text-[#d946ef] shadow-2xl mb-6"
      initial={{ scale: 0.8, opacity: 0, rotate: 180 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
    >
      <div className="w-10 h-10">
        <IconWorkflow />
      </div>
    </motion.div>
    
    <motion.div
      className="font-black tracking-tighter leading-none text-white drop-shadow-2xl"
      style={{ fontSize: "clamp(40px, 8vw, 96px)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, delay: 0.3, ease: EASE_OUT_EXPO }}
    >
      FLOWPILOT
    </motion.div>
  </div>
);

/* ─────────────────────────────────────────────────
   CONTROLS
───────────────────────────────────────────────── */
const SkipButton: React.FC<{ onSkip: () => void }> = ({ onSkip }) => (
  <motion.button
    onClick={onSkip}
    className="fixed bottom-6 right-6 z-[200] text-xs font-bold text-white/60 hover:text-white tracking-widest uppercase transition-colors duration-200 px-4 py-2 rounded-full bg-black/10 backdrop-blur-md border border-white/20 hover:bg-white/20"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 1 }}
  >
    Skip Intro
  </motion.button>
);

const DEV_MODE = process.env.NODE_ENV !== "production";
const ReplayButton: React.FC<{ onReplay: () => void }> = ({ onReplay }) =>
  DEV_MODE ? (
    <button
      onClick={onReplay}
      className="fixed top-3 right-3 z-[300] text-[10px] font-mono text-white/50 border border-white/20 px-2 py-1 rounded hover:bg-white/10 transition-colors"
    >
      ▶ replay
    </button>
  ) : null;

/* ─────────────────────────────────────────────────
   SCENE DURATIONS (ms)
───────────────────────────────────────────────── */
const SCENE_DURATIONS = [2200, 2600, 3000, 1500];
const OUTRO_DURATION = 1200;
const TOTAL_SCENES = 4;

/* ─────────────────────────────────────────────────
   MAIN INTRO COMPONENT
───────────────────────────────────────────────── */
export interface FlowPilotIntroProps {
  onComplete: () => void;
}

export function FlowPilotIntro({ onComplete }: FlowPilotIntroProps) {
  const [scene, setScene] = useState<number>(0);
  const [exiting, setExiting] = useState(false);
  const prefersReduced = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finishIntro = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    sessionStorage.setItem("flowpilot_intro_seen", "true");
    setExiting(true);
    setTimeout(() => onComplete(), 800);
  }, [onComplete]);

  useEffect(() => {
    if (prefersReduced) {
      timerRef.current = setTimeout(finishIntro, 1000);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }

    if (scene >= TOTAL_SCENES) { finishIntro(); return; }

    const dur = scene < TOTAL_SCENES - 1 ? SCENE_DURATIONS[scene] : OUTRO_DURATION;
    timerRef.current = setTimeout(() => setScene((s) => s + 1), dur);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [scene, prefersReduced, finishIntro]);

  const scenes = [
    <SceneBrandReveal key="s1" />,
    <SceneKinetic key="s2" />,
    <SceneGlassWorkflow key="s3" />,
    <SceneOutro key="s4" />,
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-hidden bg-[#111827]"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.8, ease: EASE_IN_OUT_CIRC }}
    >
      <BackgroundLayer />

      <AnimatePresence mode="wait">
        <motion.div
          key={scene}
          className="relative z-10 flex items-center justify-center w-full h-full"
          initial={prefersReduced ? {} : { opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={prefersReduced ? {} : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
        >
          {scenes[Math.min(scene, scenes.length - 1)]}
        </motion.div>
      </AnimatePresence>

      <SkipButton onSkip={finishIntro} />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────
   INTRO GATE
───────────────────────────────────────────────── */
export function IntroGate({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState<boolean | null>(null);
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("flowpilot_intro_seen");
    setShowIntro(!seen);
  }, []);

  const handleIntroComplete = useCallback(() => setIntroComplete(true), []);
  const handleReplay = useCallback(() => {
    sessionStorage.removeItem("flowpilot_intro_seen");
    setIntroComplete(false);
    setShowIntro(true);
  }, []);

  if (showIntro === null) return <div className="fixed inset-0 z-[100] bg-white" />;

  return (
    <>
      {DEV_MODE && <ReplayButton onReplay={handleReplay} />}
      <AnimatePresence>
        {showIntro && !introComplete && (
          <FlowPilotIntro onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>
      <motion.div
        animate={{ opacity: (showIntro && !introComplete) ? 0 : 1 }}
        initial={{ opacity: showIntro ? 0 : 1 }}
        transition={{ duration: 0.6 }}
      >
        {children}
      </motion.div>
    </>
  );
}
