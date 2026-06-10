"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PILLARS as ENGINE_PILLARS } from "@/lib/scoring";

// Question-phrased wording for the wizard. Factor IDs and ordering come
// from the scoring engine (lib/scoring.ts) so the two can never desync;
// any factor missing here falls back to its canonical engine label.
const WIZARD_QUESTIONS: Record<string, string> = {
  strategy_vision: "Do you have a clearly defined AI vision with target outcomes?",
  strategy_exec: "Is there executive sponsorship and governance for AI initiatives?",
  strategy_roi: "Are your AI use cases linked to ROI or risk reduction?",
  strategy_policy: "Do you have policies for responsible AI use?",
  people_awareness: "How aware is your workforce of AI opportunities?",
  people_skills: "Do you have access to AI skills or partners?",
  people_change: "How ready is your organisation for AI-driven change?",
  people_champions: "Do you have named AI champions or product owners?",
  process_manual: "Have you identified manual, repetitive workflows for AI?",
  process_standard: "Are your processes documented and standardised?",
  process_metrics: "Do operational baselines and KPIs exist?",
  process_pipeline: "Do you have a delivery process for piloting and scaling?",
  data_quality: "Is your data quality trusted across the organisation?",
  data_access: "Is data accessible across teams and tools?",
  data_governance: "Is data ownership and governance clear?",
  data_structure: "Do you have sufficient structured data for your use cases?",
  tech_stack: "Does your technology stack support modern AI tooling?",
  tech_api: "Do you have API and integration capability?",
  tech_security: "Are security and access controls in place for AI?",
  tech_scale: "Can you move AI from pilot to production scale?",
  ethics_policy: "Do you have AI ethics policies and frameworks?",
  ethics_bias: "Do you monitor for bias and fairness in AI systems?",
  ethics_compliance: "Are you ready for AI regulations (EU AI Act, GDPR)?",
  ethics_transparency: "Do you practise transparency and explainability in AI?",
  culture_innovation: "Does your organisation have an innovation culture and digital mindset?",
  culture_change: "How mature are your change management capabilities?",
  culture_collaboration: "How strong is cross-functional collaboration?",
  culture_leadership: "Is leadership aligned on AI vision and communication?",
  innovation_pilot: "Do you have proof-of-concept and pilot capabilities?",
  innovation_proto: "Is rapid prototyping infrastructure available?",
  innovation_learning: "Do you have learning loops and iteration processes?",
  innovation_metrics: "Are innovation metrics and success tracking in place?",
};

const PILLARS = ENGINE_PILLARS.map((p, i) => ({
  id: p.id,
  title: p.title,
  icon: String(i + 1).padStart(2, "0"),
  factors: p.factors.map((f) => ({
    id: f.id,
    label: WIZARD_QUESTIONS[f.id] ?? f.label,
  })),
}));

const ANSWER_OPTIONS = [
  { value: 1, label: "Not at all", sub: "No activity in this area" },
  { value: 2, label: "Some informal activity", sub: "Ad hoc, unstructured efforts" },
  { value: 3, label: "Defined in parts", sub: "Pockets of progress, not consistent" },
  { value: 4, label: "Well defined", sub: "Structured and broadly adopted" },
  { value: 5, label: "Fully embedded", sub: "Mature, measured, and optimised" },
];

const MOMENTUM_MESSAGES = [
  "Great progress — you're building a clear picture.",
  "You're ahead of most organisations at this stage.",
  "Halfway there — your responses are shaping a useful output.",
  "Strong momentum — the roadmap is taking shape.",
  "Nearly done — your scorecard is almost ready.",
];

type Scores = Record<string, number>;

const allQuestions = PILLARS.flatMap((p) =>
  p.factors.map((f) => ({ ...f, pillar: p.title, pillarId: p.id, pillarIcon: p.icon })),
);

const TOTAL = allQuestions.length;

interface AssessmentWizardProps {
  onComplete: (scores: Scores) => void;
  existingScores?: Scores;
}

export function AssessmentWizard({ onComplete, existingScores }: AssessmentWizardProps) {
  const [phase, setPhase] = useState<"start" | "questions" | "done">("start");
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Scores>(existingScores ?? {});
  const [showMomentum, setShowMomentum] = useState(false);
  const [momentumIdx, setMomentumIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const progress = useMemo(() => Math.round(((step + 1) / TOTAL) * 100), [step]);
  const question = allQuestions[step];
  const currentPillarIdx = useMemo(() => PILLARS.findIndex((p) => p.id === question?.pillarId), [question]);

  const handleAnswer = useCallback(
    (value: number) => {
      const updated = { ...scores, [question.id]: value };
      setScores(updated);

      const nextStep = step + 1;

      if (nextStep >= TOTAL) {
        const fullScores: Scores = {};
        allQuestions.forEach((q) => { fullScores[q.id] = updated[q.id] ?? 2; });
        setPhase("done");
        onComplete(fullScores);
        return;
      }

      if (nextStep > 0 && nextStep % 6 === 0) {
        setMomentumIdx((prev) => Math.min(prev + 1, MOMENTUM_MESSAGES.length - 1));
        setShowMomentum(true);
        setTimeout(() => {
          setShowMomentum(false);
          setStep(nextStep);
          setAnimKey((k) => k + 1);
        }, 1800);
      } else {
        setStep(nextStep);
        setAnimKey((k) => k + 1);
      }
    },
    [step, scores, question, onComplete],
  );

  const handleBack = useCallback(() => {
    if (step > 0) { setStep(step - 1); setAnimKey((k) => k + 1); }
    else setPhase("start");
  }, [step]);

  const handleExit = useCallback(() => {
    const fullScores: Scores = {};
    allQuestions.forEach((q) => { fullScores[q.id] = scores[q.id] ?? 2; });
    onComplete(fullScores);
  }, [scores, onComplete]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phase !== "questions" || showMomentum) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 5) handleAnswer(num);
      if (e.key === "Backspace" || e.key === "ArrowLeft") handleBack();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, showMomentum, handleAnswer, handleBack]);

  if (phase === "done") return null;

  /* ─── START SCREEN ─── */
  if (phase === "start") {
    return (
      <section style={{ minHeight: "100vh", background: "#050914", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative", overflow: "hidden" }}>
        {/* Ambient orbs */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "rgba(255,183,112,0.15)", filter: "blur(120px)", top: "-15%", right: "-10%" }} />
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(196,102,26,0.12)", filter: "blur(100px)", bottom: "-10%", left: "-5%" }} />
        </div>

        <div style={{ maxWidth: 820, width: "100%", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,183,112,0.1)", border: "1px solid rgba(255,183,112,0.2)", borderRadius: 999, padding: "6px 16px", marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--lavender-glow)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--lavender-glow)", textTransform: "uppercase", letterSpacing: "0.6px" }}>Board-Level AI Assessment</span>
          </div>

          <h1 style={{ fontSize: "clamp(34px, 5vw, 60px)", fontWeight: 460, lineHeight: 0.98, letterSpacing: "-1.6px", marginBottom: 20 }}>
            Understand where your<br />organisation <em style={{ fontStyle: "italic", color: "var(--lavender-glow)" }}>really</em> stands
          </h1>

          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.6 }}>
            32 structured questions across 8 dimensions. Your responses become an executive readiness scorecard, benchmark position, and prioritised action plan.
          </p>

          {/* Info blocks */}
          <div className="wizard-info-grid" style={{ display: "grid", gap: 16, marginBottom: 48 }}>
            {[
              { label: "Time", value: "6–8 min", icon: "⏱" },
              { label: "Questions", value: "32", icon: "📋" },
              { label: "Output", value: "Score + Roadmap", icon: "📊" },
            ].map((item) => (
              <div key={item.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                <p style={{ fontSize: 22, fontWeight: 540, margin: "0 0 4px" }}>{item.value}</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>{item.label}</p>
              </div>
            ))}
          </div>

          {/* Dimension preview */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 48 }}>
            {PILLARS.map((p) => (
              <span key={p.id} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "6px 12px" }}>
                {p.title}
              </span>
            ))}
          </div>

          <button
            onClick={() => setPhase("questions")}
            className="hover:scale-105 transition-all duration-200 cta-glow"
            style={{ padding: "18px 48px", background: "var(--lavender-glow)", color: "#080D1A", fontWeight: 600, fontSize: 17, borderRadius: 12, border: "none", cursor: "pointer" }}
          >
            Start Assessment
          </button>

          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 20 }}>
            No account required &nbsp;•&nbsp; Your data stays on your device
          </p>
        </div>

        <style jsx>{`
          .wizard-info-grid { grid-template-columns: repeat(3, 1fr); }
          @media (max-width: 640px) { .wizard-info-grid { grid-template-columns: 1fr; } }
        `}</style>
      </section>
    );
  }

  /* ─── QUESTION SCREEN ─── */
  return (
    <div style={{ minHeight: "100vh", background: "#050914", color: "#fff", position: "relative", overflow: "hidden" }}>
      {/* Ambient glow that shifts per pillar */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", transition: "opacity 600ms ease" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "rgba(255,183,112,0.08)", filter: "blur(140px)", top: "-20%", right: "-15%", transition: "transform 800ms ease", transform: `translate(${-currentPillarIdx * 30}px, ${currentPillarIdx * 20}px)` }} />
      </div>

      {/* Progress bar */}
      <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: 3, background: "rgba(255,255,255,0.06)", zIndex: 50 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, var(--amethyst-link), var(--lavender-glow))", transition: "width 400ms cubic-bezier(0.4,0,0.2,1)", borderRadius: "0 2px 2px 0" }} />
      </div>

      {/* Top bar */}
      <div style={{ position: "fixed", top: 8, left: 0, right: 0, zIndex: 49, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--lavender-glow)", letterSpacing: "0.5px" }}>
            {question.pillarIcon}/{String(PILLARS.length).padStart(2, "0")}
          </span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            {question.pillar}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
            {step + 1} of {TOTAL}
          </span>
          <button onClick={handleExit} style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", transition: "all 150ms" }} className="hover:!text-white hover:!border-white/20">
            Save & Exit
          </button>
        </div>
      </div>

      {/* Pillar dots */}
      <div style={{ position: "fixed", left: "50%", top: 14, transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 49 }}>
        {PILLARS.map((p, i) => (
          <div key={p.id} style={{ width: i === currentPillarIdx ? 24 : 8, height: 8, borderRadius: 4, background: i <= currentPillarIdx ? "var(--lavender-glow)" : "rgba(255,255,255,0.1)", transition: "all 300ms ease" }} />
        ))}
      </div>

      {/* Momentum overlay */}
      {showMomentum && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(5,9,20,0.97)" }}>
          <div style={{ textAlign: "center", animation: "wizardFadeUp 600ms ease both" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,183,112,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", border: "2px solid var(--lavender-glow)" }}>
              <span style={{ fontSize: 28, color: "var(--lavender-glow)" }}>✓</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 540, color: "#fff", marginBottom: 8 }}>
              {MOMENTUM_MESSAGES[momentumIdx]}
            </p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)" }}>
              {TOTAL - step} questions remaining
            </p>
          </div>
        </div>
      )}

      {/* Question */}
      {!showMomentum && (
        <section key={animKey} style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "80px 24px 40px", animation: "wizardFadeUp 400ms ease both" }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--lavender-glow)", textTransform: "uppercase", letterSpacing: "0.8px", background: "rgba(255,183,112,0.1)", padding: "5px 14px", borderRadius: 6 }}>
              {question.pillar}
            </span>
          </div>

          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 540, maxWidth: 660, lineHeight: 1.2, marginBottom: 44, letterSpacing: "-0.5px" }}>
            {question.label}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 480 }}>
            {ANSWER_OPTIONS.map((opt) => {
              const selected = scores[question.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  style={{
                    width: "100%",
                    padding: "18px 22px",
                    background: selected ? "var(--lavender-glow)" : "rgba(255,255,255,0.03)",
                    color: selected ? "#080D1A" : "#fff",
                    border: `1px solid ${selected ? "var(--lavender-glow)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 14,
                    fontSize: 15,
                    fontWeight: selected ? 600 : 460,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 200ms ease",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                  className="wizard-opt"
                >
                  <div>
                    <div>{opt.label}</div>
                    <div style={{ fontSize: 12, color: selected ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.35)", marginTop: 2 }}>{opt.sub}</div>
                  </div>
                  <span style={{ fontSize: 12, fontFamily: "monospace", color: selected ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.2)", flexShrink: 0 }}>{opt.value}</span>
                </button>
              );
            })}
          </div>

          {step > 0 && (
            <button onClick={handleBack} style={{ marginTop: 28, fontSize: 13, color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", transition: "color 150ms" }} className="hover:!text-white">
              ← Previous question
            </button>
          )}

          <p style={{ marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            Press 1–5 to answer &nbsp;•&nbsp; Backspace to go back
          </p>
        </section>
      )}

      <style jsx global>{`
        @keyframes wizardFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .wizard-opt:hover {
          border-color: rgba(255,183,112,0.4) !important;
          background: rgba(255,255,255,0.06) !important;
        }
      `}</style>
    </div>
  );
}
