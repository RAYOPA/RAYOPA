"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";

/* ─────────────────────────────────────────────────
   EASING PRESETS
───────────────────────────────────────────────── */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_IN_OUT_CIRC = [0.85, 0, 0.15, 1] as const;
const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;

/* ─────────────────────────────────────────────────
   SMALL SVG ICONS (inline, zero-dependency)
───────────────────────────────────────────────── */
const IconEmail = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth={1.5}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);
const IconDatabase = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth={1.5}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
  </svg>
);
const IconDoc = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth={1.5}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);
const IconSpreadsheet = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth={1.5}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
  </svg>
);
const IconCustomer = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="12" cy="7" r="4" />
    <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
  </svg>
);
const IconAI = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth={1.5}>
    <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5V11h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1v1a3 3 0 0 1-6 0v-1H7a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2V9.5C7.8 8.8 7 7.5 7 6a4 4 0 0 1 4-4z" />
    <circle cx="9" cy="14" r="1" fill="currentColor" />
    <circle cx="15" cy="14" r="1" fill="currentColor" />
  </svg>
);
const IconApproval = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth={1.5}>
    <path d="M9 12l2 2 4-4" />
    <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);
const IconAudit = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth={1.5}>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

/* ─────────────────────────────────────────────────
   FLOATING ICON CARDS (background elements)
───────────────────────────────────────────────── */
interface FloatingCardProps {
  icon: React.ReactNode;
  label: string;
  delay: number;
  x: number;
  y: number;
  color: string;
}

const FloatingCard: React.FC<FloatingCardProps> = ({ icon, label, delay, x, y, color }) => (
  <motion.div
    className="absolute flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-sm text-xs font-medium"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      borderColor: `${color}33`,
      background: `${color}11`,
      color: color,
    }}
    initial={{ opacity: 0, y: 20, scale: 0.85 }}
    animate={{ opacity: 0.65, y: 0, scale: 1 }}
    transition={{ delay, duration: 0.8, ease: EASE_OUT_EXPO }}
  >
    <span className="w-4 h-4 opacity-80">{icon}</span>
    <span className="hidden sm:inline">{label}</span>
  </motion.div>
);

/* ─────────────────────────────────────────────────
   WORKFLOW NODE
───────────────────────────────────────────────── */
interface WorkflowNodeProps {
  icon: React.ReactNode;
  label: string;
  x: string;
  y: string;
  delay: number;
  color?: string;
  isCenter?: boolean;
}

const WorkflowNode: React.FC<WorkflowNodeProps> = ({ icon, label, x, y, delay, color = "#A855F7", isCenter = false }) => (
  <motion.div
    className="absolute flex flex-col items-center gap-1.5 cursor-default"
    style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.7, ease: EASE_OUT_EXPO }}
  >
    <div
      className={`flex items-center justify-center rounded-2xl border ${isCenter ? "w-16 h-16 sm:w-20 sm:h-20" : "w-10 h-10 sm:w-12 sm:h-12"}`}
      style={{
        background: isCenter ? `${color}22` : `${color}15`,
        borderColor: `${color}44`,
        boxShadow: isCenter ? `0 0 30px ${color}44` : `0 0 10px ${color}22`,
        color,
      }}
    >
      <div className={isCenter ? "w-8 h-8 sm:w-10 sm:h-10" : "w-5 h-5 sm:w-6 sm:h-6"}>
        {icon}
      </div>
    </div>
    <span className="text-[10px] sm:text-xs font-medium opacity-70" style={{ color }}>
      {label}
    </span>
  </motion.div>
);

/* ─────────────────────────────────────────────────
   ANIMATED LINE (SVG connection)
───────────────────────────────────────────────── */
interface ConnectionLineProps {
  x1: string; y1: string; x2: string; y2: string; delay: number; color?: string;
}
const ConnectionLine: React.FC<ConnectionLineProps> = ({ x1, y1, x2, y2, delay, color = "#7C3AED" }) => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
    <motion.line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color}
      strokeWidth="1"
      strokeOpacity="0.35"
      strokeDasharray="4 4"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ delay, duration: 1, ease: "easeInOut" }}
    />
    <motion.circle
      cx={x2} cy={y2} r="2.5"
      fill={color}
      fillOpacity="0.6"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay + 0.8, duration: 0.4 }}
    />
  </svg>
);

/* ─────────────────────────────────────────────────
   SCENE 01 — BRAND REVEAL
───────────────────────────────────────────────── */
const SceneBrandReveal: React.FC = () => (
  <div className="flex flex-col items-center justify-center w-full h-full text-center select-none px-4">
    <div className="overflow-hidden">
      <motion.span
        className="block font-black tracking-[-0.04em] text-white leading-none"
        style={{ fontSize: "clamp(64px, 12vw, 140px)" }}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
      >
        FLOW
      </motion.span>
    </div>
    <div className="overflow-hidden">
      <motion.span
        className="block font-black tracking-[-0.04em] leading-none"
        style={{
          fontSize: "clamp(64px, 12vw, 140px)",
          background: "linear-gradient(135deg, #A855F7, #4F46E5)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.12, ease: EASE_OUT_EXPO }}
      >
        PILOT
      </motion.span>
    </div>
    <motion.div
      className="mt-3 flex items-center gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4, ease: EASE_OUT_QUART }}
    >
      <span
        className="text-sm sm:text-base font-semibold tracking-[0.5em] uppercase px-3 py-1 rounded-full border"
        style={{
          color: "#A855F7",
          borderColor: "#A855F722",
          background: "#A855F711",
          letterSpacing: "0.45em",
        }}
      >
        AI
      </span>
    </motion.div>
    <motion.p
      className="mt-8 text-sm sm:text-base text-white/40 font-light tracking-wide max-w-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.65 }}
    >
      From business intent to completed action.
    </motion.p>
  </div>
);

/* ─────────────────────────────────────────────────
   SCENE 02 — BUSINESS OBJECTIVE
───────────────────────────────────────────────── */
const SceneBusinessObjective: React.FC = () => {
  const floaters: FloatingCardProps[] = [
    { icon: <IconEmail />, label: "Email", delay: 0.2, x: 5, y: 20, color: "#4F46E5" },
    { icon: <IconDatabase />, label: "Database", delay: 0.35, x: 80, y: 12, color: "#7C3AED" },
    { icon: <IconSpreadsheet />, label: "Spreadsheet", delay: 0.5, x: 72, y: 72, color: "#A855F7" },
    { icon: <IconDoc />, label: "Document", delay: 0.65, x: 8, y: 68, color: "#4F46E5" },
    { icon: <IconCustomer />, label: "Customer", delay: 0.8, x: 42, y: 82, color: "#7C3AED" },
    { icon: <IconAI />, label: "AI Agent", delay: 0.95, x: 88, y: 45, color: "#A855F7" },
  ];
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full text-center select-none px-4">
      {floaters.map((f) => (
        <FloatingCard key={f.label} {...f} />
      ))}
      <div className="relative z-10">
        <div className="overflow-hidden">
          <motion.div
            className="font-black text-white/80 tracking-tight leading-none uppercase"
            style={{ fontSize: "clamp(36px, 6vw, 80px)" }}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          >
            BUSINESS
          </motion.div>
        </div>
        <div className="overflow-hidden">
          <motion.div
            className="font-black tracking-tight leading-none uppercase"
            style={{
              fontSize: "clamp(36px, 6vw, 80px)",
              background: "linear-gradient(90deg, #4F46E5, #A855F7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT_EXPO }}
          >
            INTENT
          </motion.div>
        </div>
        <motion.div
          className="font-light text-white/30 mt-4 mb-2"
          style={{ fontSize: "clamp(18px, 3vw, 40px)" }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          ↓
        </motion.div>
        <div className="overflow-hidden">
          <motion.div
            className="font-black text-white tracking-tight leading-none uppercase"
            style={{ fontSize: "clamp(36px, 6vw, 80px)" }}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55, ease: EASE_OUT_EXPO }}
          >
            BECOMES
          </motion.div>
        </div>
        <div className="overflow-hidden">
          <motion.div
            className="font-black tracking-tight leading-none uppercase"
            style={{
              fontSize: "clamp(36px, 6vw, 80px)",
              background: "linear-gradient(90deg, #7C3AED, #06B6D4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.65, ease: EASE_OUT_EXPO }}
          >
            ACTION
          </motion.div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────
   SCENE 03 — AI WORKFLOW
───────────────────────────────────────────────── */
const SceneAIWorkflow: React.FC = () => (
  <div className="relative flex flex-col items-center justify-center w-full h-full select-none overflow-hidden px-4">
    {/* lines drawn behind nodes */}
    <div className="absolute inset-0">
      <ConnectionLine x1="50%" y1="50%" x2="50%" y2="14%" delay={0.6} />
      <ConnectionLine x1="50%" y1="50%" x2="82%" y2="32%" delay={0.7} />
      <ConnectionLine x1="50%" y1="50%" x2="82%" y2="68%" delay={0.8} />
      <ConnectionLine x1="50%" y1="50%" x2="50%" y2="84%" delay={0.9} />
      <ConnectionLine x1="50%" y1="50%" x2="18%" y2="68%" delay={1.0} />
      <ConnectionLine x1="50%" y1="50%" x2="18%" y2="32%" delay={1.1} />
    </div>

    {/* Center orchestration node */}
    <WorkflowNode icon={<IconAI />} label="FlowPilot" x="50%" y="50%" delay={0.1} color="#A855F7" isCenter />

    {/* Satellite nodes */}
    <WorkflowNode icon={<IconEmail />} label="Email" x="50%" y="14%" delay={0.65} color="#4F46E5" />
    <WorkflowNode icon={<IconDatabase />} label="Database" x="82%" y="32%" delay={0.75} color="#7C3AED" />
    <WorkflowNode icon={<IconApproval />} label="Approval" x="82%" y="68%" delay={0.85} color="#A855F7" />
    <WorkflowNode icon={<IconAudit />} label="Audit" x="50%" y="84%" delay={0.95} color="#4F46E5" />
    <WorkflowNode icon={<IconDoc />} label="Docs" x="18%" y="68%" delay={1.05} color="#7C3AED" />
    <WorkflowNode icon={<IconSpreadsheet />} label="Sheets" x="18%" y="32%" delay={1.15} color="#4F46E5" />

    {/* Label */}
    <motion.div
      className="absolute top-6 left-1/2 -translate-x-1/2 text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-white/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.4, duration: 0.8 }}
    >
      Orchestration Layer
    </motion.div>
  </div>
);

/* ─────────────────────────────────────────────────
   SCENE 04 — ADAPTIVE RECOVERY
───────────────────────────────────────────────── */
const SceneAdaptiveRecovery: React.FC = () => {
  const steps = [
    { label: "ACTION", color: "#A855F7", delay: 0 },
    { label: "FAILURE", color: "#F43F5E", delay: 0.2, accent: true },
    { label: "REPLAN", color: "#7C3AED", delay: 0.4 },
    { label: "RECOVER", color: "#06B6D4", delay: 0.6 },
    { label: "VERIFY ✓", color: "#10B981", delay: 0.8 },
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full h-full select-none px-4 text-center">
      <motion.div
        className="font-black text-white/80 uppercase tracking-tight leading-none mb-1"
        style={{ fontSize: "clamp(28px, 5vw, 68px)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
      >
        WHEN WORKFLOWS CHANGE
      </motion.div>
      <motion.div
        className="font-black uppercase tracking-tight leading-none"
        style={{
          fontSize: "clamp(28px, 5vw, 68px)",
          background: "linear-gradient(90deg, #A855F7, #06B6D4)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.12, ease: EASE_OUT_EXPO }}
      >
        FLOWPILOT ADAPTS.
      </motion.div>

      <div className="mt-8 flex flex-col items-center gap-2">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <motion.div
              className="flex items-center gap-3 px-5 py-2 rounded-xl border font-bold text-sm sm:text-base tracking-wider"
              style={{
                color: step.color,
                borderColor: `${step.color}33`,
                background: `${step.color}12`,
                boxShadow: step.accent ? `0 0 20px ${step.color}33` : "none",
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + step.delay, duration: 0.6, ease: EASE_OUT_QUART }}
            >
              {step.label}
            </motion.div>
            {i < steps.length - 1 && (
              <motion.div
                className="text-white/20 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + step.delay }}
              >
                ↓
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────
   OUTRO — final brand + transition out
───────────────────────────────────────────────── */
const SceneOutro: React.FC = () => (
  <div className="flex flex-col items-center justify-center w-full h-full text-center px-4 select-none">
    <motion.div
      className="font-black tracking-[-0.03em] leading-none"
      style={{
        fontSize: "clamp(48px, 9vw, 110px)",
        background: "linear-gradient(135deg, #ffffff, #A855F7, #4F46E5)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
      initial={{ opacity: 0, scale: 0.9, letterSpacing: "0.1em" }}
      animate={{ opacity: 1, scale: 1, letterSpacing: "-0.03em" }}
      transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
    >
      FLOWPILOT AI
    </motion.div>
    <motion.p
      className="mt-5 text-sm sm:text-base text-white/40 font-light tracking-wide"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.8 }}
    >
      From business intent to completed action.
    </motion.p>
  </div>
);

/* ─────────────────────────────────────────────────
   BACKGROUND GRID / GRADIENT
───────────────────────────────────────────────── */
const BackgroundLayer: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none">
    {/* base dark gradient */}
    <div
      className="absolute inset-0"
      style={{
        background: "linear-gradient(145deg, #0a0a1a 0%, #111827 40%, #0d0621 100%)",
      }}
    />
    {/* purple aurora glow top-right */}
    <div
      className="absolute"
      style={{
        top: "-20%", right: "-10%", width: "55%", height: "55%",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)",
        filter: "blur(40px)",
      }}
    />
    {/* indigo aurora bottom-left */}
    <div
      className="absolute"
      style={{
        bottom: "-20%", left: "-10%", width: "50%", height: "50%",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)",
        filter: "blur(40px)",
      }}
    />
    {/* subtle dot grid */}
    <div
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    />
  </div>
);

/* ─────────────────────────────────────────────────
   SKIP BUTTON
───────────────────────────────────────────────── */
interface SkipButtonProps { onSkip: () => void; }
const SkipButton: React.FC<SkipButtonProps> = ({ onSkip }) => (
  <motion.button
    onClick={onSkip}
    className="fixed bottom-6 right-6 z-[200] text-xs font-medium text-white/25 hover:text-white/60 tracking-wider uppercase transition-colors duration-200 px-3 py-2 rounded-md"
    style={{ fontFamily: "inherit" }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.8 }}
    aria-label="Skip intro"
  >
    Skip intro
  </motion.button>
);

/* ─────────────────────────────────────────────────
   REPLAY (dev-only)
───────────────────────────────────────────────── */
const DEV_MODE = process.env.NODE_ENV !== "production";
interface ReplayButtonProps { onReplay: () => void; }
const ReplayButton: React.FC<ReplayButtonProps> = ({ onReplay }) =>
  DEV_MODE ? (
    <button
      onClick={onReplay}
      className="fixed top-3 right-3 z-[300] text-[10px] font-mono text-white/20 hover:text-white/50 border border-white/10 hover:border-white/30 px-2 py-1 rounded transition-colors"
      title="DEV: Replay intro"
    >
      ▶ intro
    </button>
  ) : null;

/* ─────────────────────────────────────────────────
   SCENE DURATIONS (ms)
───────────────────────────────────────────────── */
const SCENE_DURATIONS = [1100, 1100, 1200, 1200, 900];
const OUTRO_DURATION = 900;
const TOTAL_SCENES = 5;

/* ─────────────────────────────────────────────────
   MAIN INTRO COMPONENT
───────────────────────────────────────────────── */
export interface FlowPilotIntroProps {
  onComplete: () => void;
}

export function FlowPilotIntro({ onComplete }: FlowPilotIntroProps) {
  const [scene, setScene] = useState<number>(0);          // 0-4 = intro scenes, 5 = exiting
  const [exiting, setExiting] = useState(false);
  const prefersReduced = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finishIntro = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    sessionStorage.setItem("flowpilot_intro_seen", "true");
    setExiting(true);
    setTimeout(() => onComplete(), 700);
  }, [onComplete]);

  /* Auto-advance scenes */
  useEffect(() => {
    if (prefersReduced) {
      // Reduced-motion: show brand for 1s then skip
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
    <SceneBusinessObjective key="s2" />,
    <SceneAIWorkflow key="s3" />,
    <SceneAdaptiveRecovery key="s4" />,
    <SceneOutro key="s5" />,
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1, scale: exiting ? 1.04 : 1, y: exiting ? -24 : 0 }}
      transition={{ duration: 0.7, ease: EASE_IN_OUT_CIRC }}
    >
      <BackgroundLayer />

      <AnimatePresence mode="wait">
        <motion.div
          key={scene}
          className="relative z-10 flex items-center justify-center w-full h-full"
          initial={prefersReduced ? {} : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReduced ? {} : { opacity: 0, y: -28 }}
          transition={{ duration: 0.45, ease: EASE_OUT_QUART }}
        >
          {scenes[Math.min(scene, scenes.length - 1)]}
        </motion.div>
      </AnimatePresence>

      {/* Skip */}
      <SkipButton onSkip={finishIntro} />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────
   INTRO GATE — wraps login page, shows intro once
───────────────────────────────────────────────── */
interface IntroGateProps { children: React.ReactNode; }

export function IntroGate({ children }: IntroGateProps) {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState<boolean | null>(null); // null = not yet determined
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("flowpilot_intro_seen");
    setShowIntro(!seen);
  }, []);

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
  }, []);

  const handleReplay = useCallback(() => {
    sessionStorage.removeItem("flowpilot_intro_seen");
    setIntroComplete(false);
    setShowIntro(true);
  }, []);

  // Still determining
  if (showIntro === null) {
    return (
      <div className="fixed inset-0 z-[100]" style={{ background: "#111827" }} />
    );
  }

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
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {children}
      </motion.div>
    </>
  );
}
