"use client";

import { useState, useEffect } from "react";
import AIReadinessScorecardApp from "@/components/ai-readiness-scorecard";
import { AssessmentWizard } from "@/components/assessment-wizard";

const STORAGE_KEY = "ai-readiness-assessments-v3";
const ACTIVE_KEY = "ai-readiness-active-id-v3";

export default function Page() {
  const [showWizard, setShowWizard] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setShowWizard(true);
      return;
    }
    try {
      const assessments = JSON.parse(stored);
      if (!assessments.length) {
        setShowWizard(true);
        return;
      }
      const active = localStorage.getItem(ACTIVE_KEY);
      const current = assessments.find((a: { id: string }) => a.id === active) || assessments[0];
      const allDefault = Object.values(current.scores as Record<string, number>).every((v) => v === 2);
      if (allDefault) setShowWizard(true);
    } catch {
      setShowWizard(true);
    }
  }, []);

  if (!mounted) return null;

  if (showWizard) {
    return (
      <AssessmentWizard
        onComplete={(scores) => {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              const assessments = JSON.parse(stored);
              const activeId = localStorage.getItem(ACTIVE_KEY);
              const updated = assessments.map((a: { id: string; scores: Record<string, number> }) =>
                a.id === activeId ? { ...a, scores, updatedAt: new Date().toISOString() } : a,
              );
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch { /* fall through to scorecard */ }
          }
          setShowWizard(false);
        }}
      />
    );
  }

  return <AIReadinessScorecardApp />;
}
