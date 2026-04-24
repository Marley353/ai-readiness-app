"use client";

import { useState, useEffect, useCallback } from "react";
import AIReadinessScorecardApp from "@/components/ai-readiness-scorecard";
import { AssessmentWizard } from "@/components/assessment-wizard";

const STORAGE_KEY = "ai-readiness-assessments-v3";
const ACTIVE_KEY = "ai-readiness-active-id-v3";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function createAssessmentWithScores(scores: Record<string, number>) {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: "My Assessment",
    businessName: "",
    assessor: "",
    notes: "",
    sector: "other",
    createdAt: now,
    updatedAt: now,
    scores,
    companySize: "medium",
    numberOfSites: "",
    annualRevenue: "",
    operationalComplexity: "medium",
  };
}

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

  const handleComplete = useCallback((scores: Record<string, number>) => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const assessments = JSON.parse(stored);
        if (assessments.length) {
          const activeId = localStorage.getItem(ACTIVE_KEY);
          const updated = assessments.map((a: { id: string }) =>
            a.id === activeId
              ? { ...a, scores, updatedAt: new Date().toISOString() }
              : a,
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          setShowWizard(false);
          return;
        }
      } catch { /* fall through to create new */ }
    }

    const assessment = createAssessmentWithScores(scores);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([assessment]));
    localStorage.setItem(ACTIVE_KEY, assessment.id);
    setShowWizard(false);
  }, []);

  if (!mounted) return null;

  if (showWizard) {
    return <AssessmentWizard onComplete={handleComplete} />;
  }

  return <AIReadinessScorecardApp />;
}
