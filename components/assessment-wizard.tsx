"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

const PILLARS = [
  {
    id: "strategy",
    title: "Leadership & Strategy",
    factors: [
      { id: "strategy_vision", label: "Do you have a clearly defined AI vision with target outcomes?" },
      { id: "strategy_exec", label: "Is there executive sponsorship and governance for AI initiatives?" },
      { id: "strategy_roi", label: "Are your AI use cases linked to ROI or risk reduction?" },
      { id: "strategy_policy", label: "Do you have policies for responsible AI use?" },
    ],
  },
  {
    id: "people",
    title: "People & Capability",
    factors: [
      { id: "people_awareness", label: "How aware is your workforce of AI opportunities?" },
      { id: "people_skills", label: "Do you have access to AI skills or partners?" },
      { id: "people_change", label: "How ready is your organisation for AI-driven change?" },
      { id: "people_champions", label: "Do you have named AI champions or product owners?" },
    ],
  },
  {
    id: "process",
    title: "Process & Operations",
    factors: [
      { id: "process_manual", label: "Have you identified manual, repetitive workflows for AI?" },
      { id: "process_standard", label: "Are your processes documented and standardised?" },
      { id: "process_metrics", label: "Do operational baselines and KPIs exist?" },
      { id: "process_pipeline", label: "Do you have a delivery process for piloting and scaling?" },
    ],
  },
  {
    id: "data",
    title: "Data & Insight",
    factors: [
      { id: "data_quality", label: "Is your data quality trusted across the organisation?" },
      { id: "data_access", label: "Is data accessible across teams and tools?" },
      { id: "data_governance", label: "Is data ownership and governance clear?" },
      { id: "data_structure", label: "Do you have sufficient structured data for your use cases?" },
    ],
  },
  {
    id: "tech",
    title: "Technology & Integration",
    factors: [
      { id: "tech_stack", label: "Does your technology stack support modern AI tooling?" },
      { id: "tech_api", label: "Do you have API and integration capability?" },
      { id: "tech_security", label: "Are security and access controls in place for AI?" },
      { id: "tech_scale", label: "Can you move AI from pilot to production scale?" },
    ],
  },
  {
    id: "ethics",
    title: "Governance, Risk & Ethics",
    factors: [
      { id: "ethics_policy", label: "Do you have AI ethics policies and frameworks?" },
      { id: "ethics_bias", label: "Do you monitor for bias and fairness in AI systems?" },
      { id: "ethics_compliance", label: "Are you ready for AI regulations (EU AI Act, GDPR)?" },
      { id: "ethics_transparency", label: "Do you practise transparency and explainability in AI?" },
    ],
  },
  {
    id: "culture",
    title: "Culture & Change",
    factors: [
      { id: "culture_innovation", label: "Does your organisation have an innovation culture and digital mindset?" },
      { id: "culture_change", label: "How mature are your change management capabilities?" },
      { id: "culture_collaboration", label: "How strong is cross-functional collaboration?" },
      { id: "culture_leadership", label: "Is leadership aligned on AI vision and communication?" },
    ],
  },
  {
    id: "innovation",
    title: "Innovation & Experimentation",
    factors: [
      { id: "innovation_pilot", label: "Do you have proof-of-concept and pilot capabilities?" },
      { id: "innovation_proto", label: "Is rapid prototyping infrastructure available?" },
      { id: "innovation_learning", label: "Do you have learning loops and iteration processes?" },
      { id: "innovation_metrics", label: "Are innovation metrics and success tracking in place?" },
    ],
  },
];

const ANSWER_OPTIONS = [
  { value: 1, label: "Not at all" },
  { value: 2, label: "Some informal activity" },
  { value: 3, label: "Defined in parts" },
  { value: 4, label: "Well defined" },
  { value: 5, label: "Fully embedded" },
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
  p.factors.map((f) => ({ ...f, pillar: p.title, pillarId: p.id })),
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

  const progress = useMemo(() => Math.round(((step + 1) / TOTAL) * 100), [step]);
  const question = allQuestions[step];

  const handleAnswer = useCallback(
    (value: number) => {
      const updated = { ...scores, [question.id]: value };
      setScores(updated);

      const nextStep = step + 1;

      if (nextStep >= TOTAL) {
        setPhase("done");
        onComplete(updated);
        return;
      }

      if (nextStep > 0 && nextStep % 6 === 0) {
        setMomentumIdx((prev) => Math.min(prev + 1, MOMENTUM_MESSAGES.length - 1));
        setShowMomentum(true);
        setTimeout(() => {
          setShowMomentum(false);
          setStep(nextStep);
        }, 1800);
      } else {
        setStep(nextStep);
      }
    },
    [step, scores, question, onComplete],
  );

  const handleBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
    else setPhase("start");
  }, [step]);

  const handleExit = useCallback(() => {
    if (Object.keys(scores).length > 0) {
      onComplete(scores);
    } else {
      setPhase("start");
    }
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

  if (phase === "start") {
    return (
      <section
        style={{
          minHeight: "100vh",
          background: "#050914",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div style={{ maxWidth: 800, width: "100%", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--lavender-glow)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 16 }}>
            AI Readiness Assessment
          </p>

          <h1 style={{ fontSize: "clamp(32px, 4.5vw, 56px)", fontWeight: 460, lineHeight: 0.98, letterSpacing: "-1.4px", marginBottom: 24 }}>
            Understand where your organisation stands —{" "}
            <em style={{ fontStyle: "italic" }}>in under 8 minutes</em>
          </h1>

          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.6 }}>
            You'll answer a short set of structured questions across 8 dimensions.
            Your responses are translated into a readiness score, benchmark position, and priority actions.
          </p>

          {/* Info blocks */}
          <div className="wizard-info-grid" style={{ display: "grid", gap: 16, marginBottom: 40 }}>
            {[
              { label: "Time required", value: "6–8 minutes" },
              { label: "Questions", value: "32 total" },
              { label: "Output", value: "Score + Action Plan" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: 20,
                  textAlign: "left",
                }}
              >
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 18, fontWeight: 540, margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setPhase("questions")}
            className="hover:scale-105 transition-all duration-200 cta-glow"
            style={{
              padding: "18px 40px",
              background: "var(--lavender-glow)",
              color: "#080D1A",
              fontWeight: 600,
              fontSize: 17,
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
            }}
          >
            Start Assessment
          </button>

          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 20 }}>
            No account required • Your data is not stored or shared
          </p>
        </div>

        <style jsx>{`
          .wizard-info-grid { grid-template-columns: repeat(3, 1fr); }
          @media (max-width: 640px) { .wizard-info-grid { grid-template-columns: 1fr; } }
        `}</style>
      </section>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050914", color: "#fff", position: "relative" }}>
      {/* Progress bar */}
      <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: 3, background: "rgba(255,255,255,0.08)", zIndex: 50 }}>
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "var(--lavender-glow)",
            transition: "width 300ms ease",
          }}
        />
      </div>

      {/* Top bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 49, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px" }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          {step + 1} / {TOTAL}
        </span>
        <button
          onClick={handleExit}
          style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", transition: "color 150ms" }}
          className="hover:!text-white"
        >
          Exit
        </button>
      </div>

      {/* Momentum overlay */}
      {showMomentum && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(5,9,20,0.95)",
        }}>
          <div style={{ textAlign: "center", animation: "fadeUp 600ms ease both" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
            <p style={{ fontSize: 20, fontWeight: 540, color: "#fff", marginBottom: 8 }}>
              {MOMENTUM_MESSAGES[momentumIdx]}
            </p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
              {TOTAL - step} questions remaining
            </p>
          </div>
        </div>
      )}

      {/* Question */}
      {!showMomentum && (
        <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "80px 24px 40px" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--lavender-glow)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 16 }}>
            {question.pillar}
          </p>

          <h2 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 540, maxWidth: 640, lineHeight: 1.2, marginBottom: 40, letterSpacing: "-0.5px" }}>
            {question.label}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 440 }}>
            {ANSWER_OPTIONS.map((opt) => {
              const selected = scores[question.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    background: selected ? "var(--lavender-glow)" : "rgba(255,255,255,0.04)",
                    color: selected ? "#080D1A" : "#fff",
                    border: `1px solid ${selected ? "var(--lavender-glow)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: selected ? 600 : 460,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 200ms ease",
                  }}
                  className="hover:!border-[var(--lavender-glow)]"
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Back button */}
          {step > 0 && (
            <button
              onClick={handleBack}
              style={{
                marginTop: 32,
                fontSize: 14,
                color: "rgba(255,255,255,0.4)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              className="hover:!text-white"
            >
              ← Previous question
            </button>
          )}
        </section>
      )}

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
