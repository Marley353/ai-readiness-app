"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Legend } from "recharts";
import { Download, Mail, Plus, Printer, Trash2, Copy, Sparkles, AlertTriangle, TrendingUp, Shield, Building2, FileText, Zap, Target, Activity, ArrowRight, Clock, CheckCircle2, Compass, Users, Workflow, Database, Cpu, Scale, Heart, Rocket, Beaker, type LucideIcon } from "lucide-react";
import { AuthHeader } from "@/components/auth-header";
import { NeuralField } from "@/components/landing/neural-field";
import { TiltCard } from "@/components/landing/tilt-card";
import { ProGate } from "@/components/pro-gate";
import { getExternalMaturityLabel } from "@/lib/maturity-labels";
import { getIndustryInsight } from "@/lib/industry-insights";
import { useCanUse } from "@/lib/use-plan";
import jsPDF from "jspdf";

import {
  STORAGE_KEY, ACTIVE_KEY,
  type ScoreValue, type Sector, type Assessment, type Pillar,
  type CompanySize, type OperationalComplexity,
  uid,
  SECTORS, COMPANY_SIZES, REVENUE_RANGES, COMPLEXITY_LEVELS, SCALE, SHORT_SCALE,
  PILLARS, INDUSTRY_BENCHMARKS,
  makeBlankAssessment,
  getWeightedPillarScore, getWeightedOverallScore,
  getRiskScore, getBusinessImpact,
  getOperationalImpactScore, getEfficiencyOpportunityScore, getRiskExposureScore,
  getTopOpportunities, getTopRisks, getROIOpportunity, getBand,
  generateExecutiveSummary, generateRoadmap,
} from "@/lib/scoring";

import { exportPdf, mailTo } from "@/lib/pdf-export";


function scoreLabel(value: ScoreValue) {
  return `${value} - ${SCALE[value]}`;
}

function getWeightLabel(weight: number) {
  if (weight === 3) return { label: "Critical", color: "bg-red-100 text-red-700" };
  if (weight === 2) return { label: "Important", color: "bg-amber-100 text-amber-700" };
  return { label: "Standard", color: "bg-slate-100 text-slate-600" };
}

// Smooth count-up animation for numeric displays
function AnimatedNumber({ value, duration = 900, suffix = "", className = "" }: { value: number; duration?: number; suffix?: string; className?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = displayValue;
    const delta = value - startValue;
    let rafId: number;
    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + delta * eased));
      if (progress < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span className={className}>{displayValue}{suffix}</span>;
}

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const color = score >= 70 ? "#10b981" : score >= 50 ? "#38bdf8" : score >= 30 ? "#f59e0b" : "#ef4444";
  const cx = size / 2;
  const cy = size / 2;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {/* Soft glow halo matching the score colour */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -size * 0.12,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}33, transparent 70%)`,
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", position: "relative" }}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={strokeWidth} />
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${circumference - filled}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}aa)`, transition: "stroke-dasharray 1s cubic-bezier(.22,1,.36,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber value={score} suffix="%" className="text-3xl font-semibold tabular-nums text-white leading-none" />
        <span className="text-xs text-slate-400 mt-1">Readiness</span>
      </div>
    </div>
  );
}

export default function AIReadinessScorecardApp() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [tab, setTab] = useState("assess");
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sendMessage, setSendMessage] = useState("");

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    const active = localStorage.getItem(ACTIVE_KEY);
    if (stored) {
      try {
        const parsed: Assessment[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          setAssessments(parsed);
          setActiveId(active && parsed.some((a) => a.id === active) ? active : parsed[0]?.id || "");
          return;
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    const first = makeBlankAssessment();
    setAssessments([first]);
    setActiveId(first.id);
  }, []);

  useEffect(() => {
    if (mounted && assessments.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(assessments));
  }, [assessments, mounted]);

  useEffect(() => {
    if (mounted && activeId) localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId, mounted]);

  const active = useMemo(() => assessments.find((a) => a.id === activeId) || assessments[0], [assessments, activeId]);

  const updateActive = (patch: Partial<Assessment>) => {
    if (!active) return;
    setAssessments((curr) => curr.map((a) => (a.id === active.id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a)));
  };

  const updateScore = (factorId: string, value: ScoreValue) => {
    if (!active) return;
    updateActive({ scores: { ...active.scores, [factorId]: value } });
  };

  const createNew = () => {
    if (!canSaveMore) {
      window.location.href = "/pricing";
      return;
    }
    const next = makeBlankAssessment(`Assessment ${assessments.length + 1}`);
    setAssessments((curr) => [...curr, next]);
    setActiveId(next.id);
    setTab("assess");
  };

  const duplicate = () => {
    if (!active) return;
    if (!canSaveMore) {
      window.location.href = "/pricing";
      return;
    }
    const copy: Assessment = {
      ...active,
      id: uid(),
      name: `${active.name} Copy`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAssessments((curr) => [...curr, copy]);
    setActiveId(copy.id);
  };

  const removeAssessment = (id: string) => {
    const filtered = assessments.filter((a) => a.id !== id);
    if (!filtered.length) {
      const first = makeBlankAssessment();
      setAssessments([first]);
      setActiveId(first.id);
      return;
    }
    setAssessments(filtered);
    if (activeId === id) setActiveId(filtered[0].id);
  };

  // Hooks must run on every render — read plan-aware flags BEFORE the
  // early return below to avoid React error #310 (hook-count mismatch).
  const canSeeBenchmarks = useCanUse("benchmarks");
  const hasUnlimited = useCanUse("unlimitedAssessments");
  const hasCleanPdf = useCanUse("cleanPdf");
  const hasEmailShare = useCanUse("emailShare");
  // Free tier: one saved assessment at a time.
  const canSaveMore = hasUnlimited || assessments.length < 1;

  if (!mounted || !active) return null;

  const userIndustry = typeof window !== "undefined" ? localStorage.getItem("ai_industry") || "General" : "General";
  const overall = getWeightedOverallScore(active);
  const band = getBand(overall);
  const risk = getRiskScore(active);
  const impact = getBusinessImpact(active);
  const roi = getROIOpportunity(active);
  const sectorInfo = SECTORS.find((s) => s.value === active.sector);
  const operationalImpact = getOperationalImpactScore(active);
  const efficiencyOpportunity = getEfficiencyOpportunityScore(active);
  const riskExposure = getRiskExposureScore(active);
  const topOpportunities = getTopOpportunities(active);
  const topRisks = getTopRisks(active);

  const pillarData = PILLARS.map((pillar) => ({
    name: pillar.title.replace(" & ", "\n"),
    score: getWeightedPillarScore(pillar, active.scores),
    benchmark: INDUSTRY_BENCHMARKS[active.sector]?.[pillar.id] ?? 45,
    fullName: pillar.title,
    recommendation: pillar.strategicRecommendations[active.sector],
    businessImpact: pillar.businessImpact,
  }));
  const lowestPillars = [...pillarData].sort((a, b) => a.score - b.score).slice(0, 3);
  
  const riskPieData = [
    { name: "Risk Score", value: risk.score, fill: risk.level === "high" ? "#ef4444" : risk.level === "medium" ? "#f59e0b" : "#22c55e" },
    { name: "Remaining", value: 100 - risk.score, fill: "#e5e7eb" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#faf8f5" }}>
      {/* HERO HEADER */}
      <div className="aurora-bg" style={{ position: "relative", overflow: "hidden", background: "radial-gradient(ellipse at 20% 0%, rgba(255,183,112,0.28) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(196,102,26,0.28) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(255,183,112,0.18) 0%, transparent 60%), #0a0a0a" }}>
        {/* Animated neural mesh — cohesive with landing hero */}
        <NeuralField colors={["255, 183, 112", "196, 102, 26", "255, 210, 160"]} density={20000} linkDistance={130} style={{ opacity: 0.5, zIndex: 0 }} />
        {/* Top account bar */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-4 md:px-8">
          <div className="flex items-center justify-end gap-2">
            <AuthHeader />
          </div>
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-4 pb-0 md:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide animate-fade-in" style={{ background: "rgba(255,183,112,0.15)", border: "1px solid rgba(255,183,112,0.3)", color: "#ffb770", backdropFilter: "blur(10px)" }}>
                  <Sparkles className="h-3 w-3" /> AI READINESS · 8-DIMENSION FRAMEWORK
                </span>
                {sectorInfo && (
                  <span className="rounded-full px-3 py-1 text-xs font-medium text-slate-300" style={{ background: "rgba(255,255,255,0.08)" }}>
                    {sectorInfo.label}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white md:text-4xl leading-tight animate-slide-up">
                {active.businessName ? <>{active.businessName}<br /></> : null}
                <span style={{ color: "#ffb770" }}>
                  AI Transformation Readiness
                </span>
              </h1>
              <p className="mt-2 text-sm" style={{ color: "rgba(255,183,112,0.7)" }}>8 Dimensions · Industry Benchmarks · Phased Roadmap · Sector-specific Insight</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={createNew} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition hover:opacity-90" style={{ background: "#ffffff", color: "#0a0a0a" }} title={canSaveMore ? "Create a new assessment" : "Free plan saves one assessment — upgrade for unlimited"}>
                  <Plus className="h-4 w-4" /> {canSaveMore ? "New Assessment" : "New Assessment (Pro)"}
                </button>
                <button onClick={() => exportPdf(active, { watermark: !hasCleanPdf })} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white/90 transition hover:text-white hover:scale-[1.02]" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,183,112,0.2)", backdropFilter: "blur(10px)" }} title={hasCleanPdf ? "Export clean PDF" : "Free exports include a watermark — upgrade for clean PDFs"}>
                  <Download className="h-4 w-4" /> PDF
                </button>
                <button onClick={() => (hasEmailShare ? mailTo(active) : (window.location.href = "/pricing"))} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white/90 transition hover:text-white hover:scale-[1.02]" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,183,112,0.2)", backdropFilter: "blur(10px)" }} title={hasEmailShare ? "Share by email" : "Email sharing is a Pro feature"}>
                  <Mail className="h-4 w-4" /> {hasEmailShare ? "Email" : "Email (Pro)"}
                </button>
                <button onClick={duplicate} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white/90 transition hover:text-white hover:scale-[1.02]" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,183,112,0.2)", backdropFilter: "blur(10px)" }} title={canSaveMore ? "Duplicate this assessment" : "Free plan saves one assessment — upgrade for unlimited"}>
                  <Copy className="h-4 w-4" /> {canSaveMore ? "Duplicate" : "Duplicate (Pro)"}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-5 flex-shrink-0">
              <ScoreRing score={overall} size={148} />
              <div className="hidden md:flex flex-col gap-2">
                <div className={`rounded-xl px-4 py-2.5 text-center border ${band.tone}`}>
                  <p className="text-base font-black">{getExternalMaturityLabel(band.label)}</p>
                  <p className="text-xs opacity-70 mt-0.5">{band.label}</p>
                </div>
                <div className={`rounded-xl px-4 py-2.5 text-center ${risk.level === "high" ? "bg-red-100 text-red-800 border border-red-200" : risk.level === "medium" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}>
                  <p className="text-sm font-bold">{risk.level.charAt(0).toUpperCase() + risk.level.slice(1)} Risk</p>
                  <p className="text-xs opacity-70 mt-0.5">Risk Profile</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="relative z-10 mt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="mx-auto max-w-7xl px-4 py-4 md:px-8">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 stagger-children">
              {[
                { label: "AI Maturity", numeric: overall, sub: `${getExternalMaturityLabel(band.label)} (${band.label})`, icon: <TrendingUp className="h-3.5 w-3.5" />, color: "#ffb770" },
                { label: "Operational Impact", numeric: operationalImpact, sub: "Process & tech", icon: <Activity className="h-3.5 w-3.5" />, color: "#ffb770" },
                { label: "Efficiency Opportunity", numeric: efficiencyOpportunity, sub: "Improvement gap", icon: <Zap className="h-3.5 w-3.5" />, color: "#ffb770" },
                { label: "Risk Exposure", numeric: riskExposure, sub: `${risk.level.charAt(0).toUpperCase() + risk.level.slice(1)} risk`, icon: <AlertTriangle className="h-3.5 w-3.5" />, color: riskExposure >= 60 ? "#fda4af" : riskExposure >= 30 ? "#fcd34d" : "#86efac" },
              ].map((kpi) => (
                <TiltCard key={kpi.label} max={6} scale={1.03} glare={false} className="glass-strong rounded-2xl p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold mb-1.5" style={{ color: kpi.color }}>
                    {kpi.icon} {kpi.label}
                  </div>
                  <AnimatedNumber value={kpi.numeric} suffix="%" className="text-2xl font-semibold tabular-nums text-white" />
                  <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>
                </TiltCard>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[260px,1fr]">

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <p className="text-sm font-bold text-slate-900">Assessments</p>
                <p className="text-xs text-slate-400 mt-0.5">Switch between saved scorecards</p>
              </div>
              <div className="p-3 space-y-2">
                {assessments.map((item) => {
                  const itemOverall = getWeightedOverallScore(item);
                  const itemSector = SECTORS.find((s) => s.value === item.sector);
                  const isActive = item.id === active.id;
                  return (
                    <div key={item.id} className="rounded-xl p-3 transition cursor-pointer hover-lift" style={{ border: isActive ? "1px solid #c4661a" : "1px solid #f1f5f9", background: isActive ? "linear-gradient(135deg, #f3eefd, #ece3fb)" : "white" }}>
                      <button className="w-full text-left" onClick={() => setActiveId(item.id)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold" style={{ color: isActive ? "#4b2d8a" : "#0f172a" }}>{item.name}</p>
                            <p className="truncate text-xs text-slate-400 mt-0.5">{item.businessName || "No organisation set"}</p>
                            {itemSector && <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full" style={{ background: isActive ? "#e2d6f9" : "#f1f5f9", color: isActive ? "#4b2d8a" : "#64748b" }}>{itemSector.label}</span>}
                          </div>
                          <span className="text-xs font-black rounded-full px-2.5 py-1 flex-shrink-0" style={{ background: itemOverall >= 70 ? "#d6ead9" : itemOverall >= 50 ? "#e2d6f9" : itemOverall >= 30 ? "#f1e4c7" : "#f3d8df", color: itemOverall >= 70 ? "#4d7c63" : itemOverall >= 50 ? "#4b2d8a" : itemOverall >= 30 ? "#8f7240" : "#9a3b57" }}>
                            {itemOverall}%
                          </span>
                        </div>
                      </button>
                      <div className="mt-2 flex justify-end">
                        <button onClick={() => removeAssessment(item.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Framework info card */}
            <div className="relative rounded-2xl overflow-hidden hover-lift" style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-40 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #ffb770, transparent)" }} />
              <div className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #c4661a, transparent)" }} />
              <div className="relative p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-white" />
                  <p className="text-xs font-bold uppercase tracking-wider text-white">8-Dimension Framework</p>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed mb-3">Aligned with Microsoft, AIMRI and EU AI Act standards.</p>
                <div className="space-y-1">
                  {PILLARS.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ background: "linear-gradient(180deg, #c4661a, #ffb770)" }} />
                      <span className="text-xs text-white/85 font-medium leading-tight">{p.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick stats card */}
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden hover-lift" style={{ border: "1px solid #e2e8f0" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" style={{ color: "#c4661a" }} />
                  Active Assessment
                </p>
              </div>
              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Maturity</span>
                  <span className="font-bold" style={{ color: overall >= 70 ? "#4d7c63" : overall >= 50 ? "#c4661a" : overall >= 30 ? "#8f7240" : "#9a3b57" }}>{getExternalMaturityLabel(band.label)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Risk profile</span>
                  <span className="font-bold capitalize" style={{ color: risk.level === "high" ? "#f43f5e" : risk.level === "medium" ? "#f59e0b" : "#10b981" }}>{risk.level}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">ROI range</span>
                  <span className="font-bold text-slate-700">{roi.range}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Last updated</span>
                  <span className="font-bold text-slate-700">{new Date(active.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div>
            <Tabs value={tab} onValueChange={setTab} className="space-y-5">
              <TabsList className="grid w-full grid-cols-6 rounded-full bg-black/90 p-1 h-auto shadow-sm" style={{ border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
                {[
                  { value: "assess", label: "Assess", icon: <Target className="h-3.5 w-3.5" /> },
                  { value: "results", label: "Results", icon: <Activity className="h-3.5 w-3.5" /> },
                  { value: "roadmap", label: "Roadmap", icon: <TrendingUp className="h-3.5 w-3.5" /> },
                  { value: "report", label: "Report", icon: <FileText className="h-3.5 w-3.5" /> },
                  { value: "compare", label: "Compare", icon: <Building2 className="h-3.5 w-3.5" /> },
                  { value: "recommendations", label: "Actions", icon: <Sparkles className="h-3.5 w-3.5" /> },
                ].map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="flex items-center justify-center gap-1.5 rounded-full text-xs font-semibold py-2.5 transition text-white/60 hover:text-white/90 data-[state=active]:text-black data-[state=active]:bg-white data-[state=active]:shadow-[0_0_16px_rgba(255,255,255,0.25)]" style={{ ["--tw-ring-color" as string]: "transparent" }}>
                    {t.icon}
                    <span className="hidden sm:inline">{t.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ─── ASSESS TAB ─── */}
              <TabsContent value="assess" className="space-y-5">
                {/* Assessment Details */}
                <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                  <div className="px-6 py-4" style={{ background: "#0a0a0a", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <h2 className="text-base font-bold text-white">Assessment Details</h2>
                    <p className="text-xs text-white/60 mt-0.5">Set context before completing the pillar questions.</p>
                  </div>
                  <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assessment Name</Label>
                      <Input value={active.name} onChange={(e) => updateActive({ name: e.target.value })} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Organisation</Label>
                      <Input value={active.businessName} onChange={(e) => updateActive({ businessName: e.target.value })} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assessor</Label>
                      <Input value={active.assessor} onChange={(e) => updateActive({ assessor: e.target.value })} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sector</Label>
                      <Select value={active.sector} onValueChange={(value: Sector) => updateActive({ sector: value })}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SECTORS.map((sector) => (
                            <SelectItem key={sector.value} value={sector.value}>
                              <div><div className="font-semibold">{sector.label}</div><div className="text-xs text-slate-500">{sector.description}</div></div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 md:col-span-2 lg:col-span-4">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</Label>
                      <Textarea value={active.notes} onChange={(e) => updateActive({ notes: e.target.value })} placeholder="Context, assumptions, known blockers, target operating model notes..." className="rounded-xl" />
                    </div>
                  </div>
                </div>

                {/* Business Profile */}
                <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                  <div className="px-6 py-4" style={{ background: "#0a0a0a", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <h2 className="text-base font-bold text-white">Business Profile</h2>
                    <p className="text-xs text-white/60 mt-0.5">Organisation context that influences readiness interpretation.</p>
                  </div>
                  <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Size</Label>
                      <Select value={active.companySize} onValueChange={(value: CompanySize) => updateActive({ companySize: value })}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COMPANY_SIZES.map((size) => (
                            <SelectItem key={size.value} value={size.value}>
                              <div><div className="font-semibold">{size.label}</div><div className="text-xs text-slate-500">{size.description}</div></div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Number of Sites</Label>
                      <Input value={active.numberOfSites} onChange={(e) => updateActive({ numberOfSites: e.target.value })} placeholder="e.g. 25 sites" className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Annual Revenue</Label>
                      <Select value={active.annualRevenue} onValueChange={(value) => updateActive({ annualRevenue: value })}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select range" /></SelectTrigger>
                        <SelectContent>
                          {REVENUE_RANGES.map((range) => (<SelectItem key={range} value={range}>{range}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operational Complexity</Label>
                      <Select value={active.operationalComplexity} onValueChange={(value: OperationalComplexity) => updateActive({ operationalComplexity: value })}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COMPLEXITY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <div><div className="font-semibold">{level.label}</div><div className="text-xs text-slate-500">{level.description}</div></div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Pillar cards — 2 per row on desktop for denser scanning */}
                <div className="grid gap-5 lg:grid-cols-2">
                {PILLARS.map((pillar, pillarIdx) => {
                  const pillarScore = getWeightedPillarScore(pillar, active.scores);
                  return (
                    <div
                      key={pillar.id}
                      className="rounded-2xl bg-white shadow-sm overflow-hidden hover-lift animate-slide-up flex flex-col"
                      style={{ border: "1px solid #e2e8f0", animationDelay: `${pillarIdx * 60}ms` }}
                    >
                      {/* Header row — fixed min-height so all pillar cards align their factor grids consistently */}
                      <div className="flex flex-col gap-4 p-6 md:flex-row md:items-start md:justify-between" style={{ minHeight: 160 }}>
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div
                            className="flex-shrink-0 w-11 h-11 rounded-[10px] flex items-center justify-center"
                            style={{
                              background: "rgba(196,102,26,0.1)",
                            }}
                          >
                            <pillar.Icon className="h-5 w-5" strokeWidth={1.75} style={{ color: "#c4661a" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">{pillar.title}</h3>
                            <p className="text-[13px] text-slate-500 mt-1 leading-relaxed line-clamp-2" title={pillar.description}>
                              {pillar.description}
                            </p>
                          </div>
                        </div>
                        <div className="md:min-w-[200px] md:flex-shrink-0">
                          <div className="flex justify-between items-baseline mb-1.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Weighted Score</span>
                            <span className="text-sm font-semibold tabular-nums" style={{ color: "#c4661a" }}>{pillarScore}%</span>
                          </div>
                          <div className="relative h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full progress-fill"
                              style={{
                                width: `${pillarScore}%`,
                                background: "linear-gradient(90deg, #c4661a, #ffb770)",
                              }}
                            />
                            {canSeeBenchmarks && (
                              <div
                                className="absolute top-0 h-full w-0.5 bg-slate-700/70"
                                style={{ left: `${INDUSTRY_BENCHMARKS[active.sector]?.[pillar.id] ?? 45}%` }}
                                title={`Industry benchmark: ${INDUSTRY_BENCHMARKS[active.sector]?.[pillar.id] ?? 45}%`}
                              />
                            )}
                          </div>
                          {canSeeBenchmarks ? (
                            <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400 tabular-nums">
                              <span>
                                vs. {sectorInfo?.label} avg{" "}
                                <span className="font-bold text-slate-600">{INDUSTRY_BENCHMARKS[active.sector]?.[pillar.id] ?? 45}%</span>
                              </span>
                              <span
                                className={`font-bold ${
                                  pillarScore > (INDUSTRY_BENCHMARKS[active.sector]?.[pillar.id] ?? 45)
                                    ? "text-emerald-600"
                                    : "text-amber-600"
                                }`}
                              >
                                {pillarScore > (INDUSTRY_BENCHMARKS[active.sector]?.[pillar.id] ?? 45) ? "↑ Above" : "↓ Below"}
                              </span>
                            </div>
                          ) : (
                            <a
                              href="/pricing"
                              className="block mt-1.5 text-[10px] text-slate-400 hover:text-[#c4661a] transition"
                            >
                              <Sparkles className="inline h-3 w-3 mr-1" /> Upgrade for {sectorInfo?.label} benchmark
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Thin divider between header and factor grid — feels IONOS-clean */}
                      <div className="mx-6" style={{ borderTop: "1px solid #f1f5f9" }} />

                      <div className="grid gap-3 p-6 md:grid-cols-2 flex-1">
                        {pillar.factors.map((factor) => {
                          const weightInfo = getWeightLabel(factor.weight);
                          const currentScore = active.scores[factor.id];
                          // Muted, Framer-aligned score palette — dark & sophisticated, still signals low-to-high
                          const btnBg = ["", "#9a3b57", "#9a5a3b", "#8f7240", "#5a7d8c", "#4d7c63"];
                          return (
                            <div key={factor.id} className="rounded-xl p-4 transition-colors hover:bg-white hover:shadow-sm" style={{ border: "1px solid #f1f5f9", background: "#f8fafc" }}>
                              <div className="mb-3 flex items-start justify-between gap-2">
                                <p className="text-sm font-bold text-slate-800">{factor.label}</p>
                                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${weightInfo.color}`}>{weightInfo.label}</span>
                              </div>
                              <div className="grid grid-cols-5 gap-1.5">
                                {([1, 2, 3, 4, 5] as const).map((value) => {
                                  const isSelected = currentScore === value;
                                  return (
                                    <button
                                      key={value}
                                      onClick={() => updateScore(factor.id, value)}
                                      className="rounded-xl py-3 text-xs font-bold score-btn"
                                      style={{
                                        background: isSelected ? btnBg[value] : "white",
                                        color: isSelected ? "white" : "#94a3b8",
                                        border: isSelected ? `2px solid ${btnBg[value]}` : "2px solid #e2e8f0",
                                        transform: isSelected ? "scale(1.08)" : "scale(1)",
                                        boxShadow: isSelected ? `0 6px 16px ${btnBg[value]}55` : "none",
                                      }}
                                    >
                                      <div className="text-base leading-none">{value}</div>
                                      <div className="mt-1 text-[10px] hidden md:block leading-tight opacity-80 truncate px-0.5">{SHORT_SCALE[value]}</div>
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="mt-2.5 text-xs text-slate-400">Selected: <span className="font-semibold text-slate-600">{scoreLabel(currentScore)}</span></p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                </div>
              </TabsContent>

              {/* ─── RESULTS TAB ─── */}
              <TabsContent value="results" className="space-y-6">
                {/* ── RESULTS HEADER ── */}
                <div className="rounded-2xl p-8 text-center" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#c4661a" }}>Assessment Complete</p>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">Your Executive AI Readiness Report</h2>
                  <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">A board-level view of where your organisation is strong, where it is exposed, and which dimensions need priority investment.</p>
                </div>

                {/* ── OVERALL SCORE + DIMENSION BREAKDOWN ── */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Overall Score Card */}
                  <div className="rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Overall Readiness</p>
                    <div className="flex items-end gap-2 mb-4">
                      <span className="text-5xl font-semibold tabular-nums tracking-tight" style={{ color: "#c4661a" }}>{Math.round(overall)}</span>
                      <span className="text-lg text-slate-400 mb-1">/100</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full mb-6" style={{ background: "#e2e8f0" }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${overall}%`, background: "linear-gradient(90deg, #c4661a, #ffb770)" }} />
                    </div>
                    <div className="rounded-xl p-4" style={{ background: "rgba(255,183,112,0.06)", border: "1px solid rgba(255,183,112,0.18)" }}>
                      <p className="text-xs text-slate-400 mb-1">Maturity band</p>
                      <p className="text-xl font-black text-slate-900">{getExternalMaturityLabel(band.label)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">({band.label})</p>
                      <p className="text-sm text-slate-500 mt-2 leading-relaxed">{band.advice}</p>
                    </div>
                  </div>

                  {/* Dimension Breakdown Card */}
                  <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">8-Dimension Breakdown</p>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Readiness Profile</h3>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {pillarData.map((pillar, idx) => (
                        <div key={pillar.fullName}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm text-slate-700">{pillar.fullName}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400 font-mono">{pillar.benchmark}% avg</span>
                              <span className="text-sm font-semibold tabular-nums" style={{ color: "#c4661a" }}>{Math.round(pillar.score)}%</span>
                            </div>
                          </div>
                          <div className="relative w-full h-2 rounded-full" style={{ background: "#e2e8f0" }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pillar.score}%`, background: "linear-gradient(90deg, #c4661a, #ffb770)" }} />
                            <div className="absolute top-0 h-full w-0.5" style={{ left: `${pillar.benchmark}%`, background: "#94a3b8" }} title={`Industry avg: ${pillar.benchmark}%`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── CHARTS ── */}
                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <div className="px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <h3 className="font-bold text-slate-900 text-sm">Pillar Score Overview</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Weighted scores vs industry benchmarks</p>
                    </div>
                    <div className="p-4 h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pillarData} layout="vertical" barCategoryGap="28%" margin={{ left: 8, right: 16 }}>
                          <CartesianGrid horizontal={false} stroke="#f1f5f9" strokeWidth={1} />
                          <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} ticks={[0, 25, 50, 75, 100]} />
                          <YAxis type="category" dataKey="name" width={64} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }} />
                          <Tooltip cursor={{ fill: "rgba(15,23,42,0.04)" }} contentStyle={{ borderRadius: 8, background: "#fff", border: "1px solid rgba(226,232,240,0.6)", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)", fontSize: 12, padding: "6px 10px" }} />
                          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                          <Bar dataKey="score" name="Your Score" fill="#c4661a" radius={[0, 5, 5, 0]} barSize={14} background={{ fill: "#f8fafc", radius: 5 }} />
                          <Bar dataKey="benchmark" name="Industry Avg" fill="#e2e8f0" radius={[0, 5, 5, 0]} barSize={5} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <div className="px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <h3 className="font-bold text-slate-900 text-sm">Readiness Shape</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Visual capability balance across all dimensions</p>
                    </div>
                    <div className="p-4 h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={pillarData} margin={{ top: 12, right: 28, bottom: 12, left: 28 }}>
                          <defs>
                            <radialGradient id="radarFill" cx="50%" cy="50%" r="65%">
                              <stop offset="0%" stopColor="#ffb770" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="#c4661a" stopOpacity={0.08} />
                            </radialGradient>
                          </defs>
                          <PolarGrid gridType="polygon" stroke="#e2e8f0" strokeWidth={1} radialLines={false} />
                          <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} />
                          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Your Score" dataKey="score" fill="url(#radarFill)" stroke="#c4661a" strokeWidth={2} dot={{ r: 3, fill: "#c4661a", strokeWidth: 2, stroke: "#fff" }} />
                          <Radar name="Industry Avg" dataKey="benchmark" fill="#94a3b8" fillOpacity={0.05} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" />
                          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                          <Tooltip contentStyle={{ borderRadius: 8, background: "#fff", border: "1px solid rgba(226,232,240,0.6)", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)", fontSize: 12, padding: "6px 10px" }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* ── INSIGHT CARDS: Interpretation ── */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Strongest Dimension</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight">{[...pillarData].sort((a, b) => b.score - a.score)[0].fullName}</p>
                    <p className="text-2xl font-black mt-1" style={{ color: "#22c55e" }}>{Math.round([...pillarData].sort((a, b) => b.score - a.score)[0].score)}%</p>
                  </div>
                  <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Priority Gap</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight">{lowestPillars[0].fullName}</p>
                    <p className="text-2xl font-black mt-1" style={{ color: "#c4661a" }}>{Math.round(lowestPillars[0].score)}%</p>
                  </div>
                  <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Risk Level</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight">{risk.level.charAt(0).toUpperCase() + risk.level.slice(1)} Risk</p>
                    <p className="text-2xl font-black mt-1" style={{ color: risk.level === "high" ? "#ef4444" : risk.level === "medium" ? "#f59e0b" : "#22c55e" }}>{risk.score}/100</p>
                    {risk.factors.length > 0 && (
                      <div className="mt-3 pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
                        <p className="text-xs text-slate-500 mb-1">Critical factors:</p>
                        {risk.factors.slice(0, 3).map((f, i) => <p key={i} className="text-xs text-slate-600">• {f}</p>)}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── BUSINESS IMPACT + ROI ── */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="h-4 w-4 text-slate-500" strokeWidth={2} />
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Commercial Impact</p>
                    </div>
                    <p className="text-xl font-black text-slate-900 tracking-tight mb-2">{impact.category}</p>
                    <p className="text-sm text-slate-500 leading-relaxed">{impact.description}</p>
                  </div>
                  <div className="rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-4 w-4 text-slate-500" strokeWidth={2} />
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Estimated ROI Potential</p>
                    </div>
                    <p className="text-3xl font-semibold tabular-nums tracking-tight mb-1" style={{ color: "#c4661a" }}>{roi.range}</p>
                    <p className="text-xs text-slate-400 mb-4">Projected efficiency improvement • {roi.confidence} confidence</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: "Low", value: roi.scenarios.low },
                        { label: "Mid", value: roi.scenarios.mid },
                        { label: "High", value: roi.scenarios.high },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg p-2" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{s.label}</p>
                          <p className="text-sm font-black text-slate-900">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── OPPORTUNITIES + RISKS ── */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <div className="px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-emerald-600" strokeWidth={2} />
                        <h3 className="font-bold text-slate-900 text-sm">Top 3 AI Opportunities</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Highest-impact for {sectorInfo?.label}</p>
                    </div>
                    <div className="p-4 space-y-2.5">
                      {topOpportunities.map((opp, idx) => (
                        <div key={idx} className="rounded-xl p-4" style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{opp.title}</p>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opp.description}</p>
                            </div>
                            <span className="flex-shrink-0 text-[10px] px-2 py-1 rounded-full font-bold" style={{ background: "#ecfdf5", color: "#065f46" }}>{opp.impact}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <div className="px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-600" strokeWidth={2} />
                        <h3 className="font-bold text-slate-900 text-sm">Top 3 Risks if No Action</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Consequences of delaying AI transformation</p>
                    </div>
                    <div className="p-4 space-y-2.5">
                      {topRisks.map((r, idx) => (
                        <div key={idx} className="rounded-xl p-4" style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{r.title}</p>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.description}</p>
                            </div>
                            <span className="flex-shrink-0 text-[10px] px-2 py-1 rounded-full font-bold" style={{ background: r.severity === "High" ? "#fef2f2" : "#fffbeb", color: r.severity === "High" ? "#991b1b" : "#854d0e" }}>{r.severity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── INDUSTRY INSIGHT CARD ── */}
                <div className="rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#c4661a" }} />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Industry Insight — {userIndustry}</p>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{getIndustryInsight(userIndustry)}</p>
                </div>

                {/* ── PRO UPSELL CARD ── */}
                <div className="rounded-2xl p-8 text-center relative overflow-hidden" style={{ background: "#292827", border: "1px solid rgba(255,183,112,0.2)" }}>
                  <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20 blur-[80px] pointer-events-none" style={{ background: "#ffb770" }} />
                  <div className="relative">
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#ffb770" }}>Enterprise Upgrade</p>
                    <h3 className="text-xl md:text-2xl font-black text-white tracking-tight mb-2">Your board-ready 90-day transformation plan is ready</h3>
                    <p className="text-sm text-slate-400 max-w-lg mx-auto mb-6 leading-relaxed">
                      Unlock strategic recommendations, industry benchmarks, presentation-ready exports, and a structured roadmap designed for executive decision-making.
                    </p>
                    <button
                      onClick={() => setTab("roadmap")}
                      className="hover:scale-105 transition-all duration-200"
                      style={{ padding: "14px 32px", background: "#ffb770", color: "#292827", fontWeight: 600, fontSize: 15, borderRadius: 10, border: "none", cursor: "pointer", boxShadow: "0 0 32px rgba(255,183,112,0.2)" }}
                    >
                      Unlock 90-Day Plan
                    </button>
                  </div>
                </div>

                {/* ─── SAVE YOUR RESULTS ─── */}
                <div className="rounded-3xl bg-white shadow-sm p-8" style={{ border: "1px solid #e2e8f0" }}>
                  <p className="text-sm uppercase tracking-widest font-bold mb-3" style={{ color: "#00C9A7" }}>Save your results</p>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Send this to yourself or your team</h3>
                  <p className="text-sm text-slate-500 mb-6">Get a copy of your readiness score and key insights to review or share internally.</p>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (sendState !== "idle") setSendState("idle"); }}
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-3 rounded-xl text-slate-900 placeholder:text-slate-400"
                      style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                    />
                    <button
                      disabled={sendState === "sending" || sendState === "sent"}
                      onClick={async () => {
                        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                          setSendState("error");
                          setSendMessage("Please enter a valid email address.");
                          return;
                        }
                        setSendState("sending");
                        setSendMessage("");
                        try {
                          const res = await fetch("/api/send-results", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              email,
                              summary: generateExecutiveSummary(active),
                              businessName: active.businessName || undefined,
                            }),
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setSendState("sent");
                            setSendMessage("Results sent — check your inbox.");
                          } else {
                            setSendState("error");
                            setSendMessage(data.error || "Sending failed. Please try again.");
                          }
                        } catch {
                          setSendState("error");
                          setSendMessage("Network error. Please try again.");
                        }
                      }}
                      className="px-6 py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
                      style={{ background: sendState === "sent" ? "#059669" : "#00C9A7", cursor: sendState === "sending" ? "wait" : "pointer", opacity: sendState === "sending" ? 0.7 : 1 }}
                    >
                      {sendState === "sending" ? "Sending…" : sendState === "sent" ? "Sent ✓" : "Send Results"}
                    </button>
                  </div>
                  {sendMessage && (
                    <p className="mt-3 text-sm" style={{ color: sendState === "error" ? "#dc2626" : "#059669" }}>
                      {sendMessage}
                    </p>
                  )}
                </div>

                {/* ─── BOARD SHARE ─── */}
                <div className="rounded-3xl p-8" style={{ background: "#f8fafc", border: "1px solid #00C9A7" }}>
                  <p className="text-sm uppercase tracking-widest font-bold mb-3" style={{ color: "#00C9A7" }}>Board-ready output</p>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Need to present this internally?</h3>
                  <p className="text-slate-600 mb-4">Export a clean executive summary and supporting insights ready for board or leadership discussion.</p>
                  <button
                    onClick={() => exportPdf(active, { watermark: !hasCleanPdf })}
                    className="px-6 py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
                    style={{ background: "#00C9A7" }}
                    title={hasCleanPdf ? "Download the board-ready PDF report" : "Free exports include a watermark — upgrade for the clean board pack"}
                  >
                    Download Board Summary (PDF)
                  </button>
                </div>

                {/* ─── RETURN LOOP ─── */}
                <div className="text-center mt-16 text-sm text-slate-400">
                  <p>AI readiness evolves quickly. Reassess in 90 days to track progress and measure what has improved.</p>
                </div>

              </TabsContent>

              {/* ─── ROADMAP TAB ─── */}
              <TabsContent value="roadmap" className="space-y-5">
                <ProGate
                  feature="roadmap"
                  variant="replace"
                  title="12-Month Maturity Roadmap"
                  description="Upgrade to Pro to unlock the auto-generated phased 0–90 day / 3–6 month / 6–12 month plan tailored to your scores and sector."
                >
                <div className="rounded-2xl bg-white shadow-sm overflow-hidden animate-fade-in" style={{ border: "1px solid #e2e8f0" }}>
                  <div className="relative px-6 py-5 overflow-hidden" style={{ background: "#0a0a0a", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="absolute -top-20 -right-10 w-60 h-60 rounded-full opacity-50 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #ffb770, transparent 60%)" }} />
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-40 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #c4661a, transparent 60%)" }} />
                    <div className="relative flex items-center gap-3">
                      <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-white tracking-tight">12-Month AI Maturity Roadmap</h2>
                        <p className="text-xs text-white/60 mt-0.5">A phased plan tailored to your current readiness scores and sector context</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid gap-4 md:grid-cols-3 stagger-children">
                      {generateRoadmap(active).map((phase, idx) => (
                        <div key={phase.phase} className="rounded-2xl overflow-hidden hover-lift shadow-sm" style={{ background: phase.bgColor, border: `1px solid ${phase.borderColor}` }}>
                          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${phase.borderColor}` }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black text-white" style={{ background: phase.color }}>
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "white", color: phase.color, border: `1px solid ${phase.borderColor}` }}>
                                <Clock className="h-3 w-3 inline-block mr-1 -mt-0.5" />
                                {phase.timeline}
                              </span>
                            </div>
                            <h3 className="font-black text-base mt-2" style={{ color: phase.color }}>{phase.phase}</h3>
                            <p className="text-xs font-semibold text-slate-700 mt-1">{phase.focus}</p>
                            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{phase.description}</p>
                          </div>
                          <div className="p-4 space-y-2.5">
                            {phase.items.slice(0, 5).map((item, i) => (
                              <div key={i} className="rounded-xl bg-white p-3 hover-lift" style={{ border: `1px solid ${phase.borderColor}` }}>
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <item.PillarIcon className="h-4 w-4 flex-shrink-0" style={{ color: phase.color }} strokeWidth={2.2} />
                                    {item.pillar}
                                  </p>
                                  <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: phase.color, color: "white" }}>
                                    {item.priority}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">{item.action}</p>
                                {item.score < 100 && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                                      <div className="h-full rounded-full progress-fill" style={{ width: `${item.score}%`, background: phase.color }} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500">{item.score}%</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Roadmap meta info */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl p-5 bg-white shadow-sm hover-lift" style={{ border: "1px solid #e2e8f0" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-slate-800" strokeWidth={2.2} />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tailored to You</p>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">Roadmap actions are derived from your weighted pillar scores and {sectorInfo?.label} sector best practices.</p>
                  </div>
                  <div className="rounded-2xl p-5 bg-white shadow-sm hover-lift" style={{ border: "1px solid #e2e8f0" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-slate-800" strokeWidth={2.2} />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Review Quarterly</p>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">Re-run the assessment every 90 days to track progress and reprioritise as capabilities mature.</p>
                  </div>
                  <div className="rounded-2xl p-5 bg-white shadow-sm hover-lift" style={{ border: "1px solid #e2e8f0" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-slate-800" strokeWidth={2.2} />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phased ROI</p>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">Expect early efficiency gains in Phase 1, transformational impact emerging in Phase 2, and enterprise-wide value in Phase 3.</p>
                  </div>
                </div>
                </ProGate>
              </TabsContent>

              {/* ─── REPORT TAB ─── */}
              <TabsContent value="report" className="space-y-5">
                <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                  <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <div>
                      <h3 className="font-black text-slate-900 flex items-center gap-2"><FileText className="h-4 w-4 text-sky-600" /> Client Report Summary</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Executive-level summary for stakeholder communication</p>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(generateExecutiveSummary(active)).catch(() => alert("Copy failed — your browser blocked clipboard access."))} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition" style={{ background: "#e0f2fe", color: "#0369a1" }}>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="rounded-2xl p-6" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">{generateExecutiveSummary(active)}</pre>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                    <div className="px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <h3 className="font-black text-slate-900">Key Metrics</h3>
                    </div>
                    <div className="divide-y divide-slate-50 px-6">
                      {[
                        { label: "Overall Readiness", value: `${overall}%` },
                        { label: "Maturity Band", badge: <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${band.tone}`}>{getExternalMaturityLabel(band.label)} ({band.label})</span> },
                        { label: "Risk Level", badge: <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: risk.level === "high" ? "#fee2e2" : risk.level === "medium" ? "#fef3c7" : "#d1fae5", color: risk.level === "high" ? "#991b1b" : risk.level === "medium" ? "#92400e" : "#065f46" }}>{risk.level.charAt(0).toUpperCase() + risk.level.slice(1)}</span> },
                        { label: "ROI Potential", value: roi.range },
                        { label: "Sector", value: sectorInfo?.label },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between py-3.5">
                          <span className="text-sm text-slate-500">{row.label}</span>
                          {row.badge || <span className="text-sm font-black text-slate-900">{row.value}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                    <div className="px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <h3 className="font-black text-slate-900">Pillar Summary</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      {pillarData.map((pillar, idx) => (
                        <div key={pillar.fullName}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-semibold text-slate-700">{pillar.fullName}</span>
                            <span className="font-semibold tabular-nums" style={{ color: "#c4661a" }}>{pillar.score}%</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pillar.score}%`, background: "linear-gradient(90deg, #c4661a, #ffb770)" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ─── COMPARE TAB ─── */}
              <TabsContent value="compare" className="space-y-4">
                <ProGate
                  feature="compare"
                  variant="replace"
                  title="Side-by-side Comparison"
                  description="Upgrade to Pro to benchmark two saved assessments against each other — perfect for tracking progress quarter over quarter or comparing business units."
                >
                  <CompareView assessments={assessments} />
                </ProGate>
              </TabsContent>

              {/* ─── RECOMMENDATIONS TAB ─── */}
              <TabsContent value="recommendations" className="space-y-5">
                <ProGate
                  feature="sectorRecommendations"
                  variant="replace"
                  title="Strategic Recommendations"
                  description="Upgrade to Pro for sector-specific strategic recommendations tailored to each of your weakest pillars, plus prioritised risk mitigation actions."
                >
                <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                  <div className="px-6 py-4" style={{ background: "#0a0a0a", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <h2 className="font-black text-white flex items-center gap-2 tracking-tight"><Sparkles className="h-4 w-4 text-white" /> Strategic Recommendations</h2>
                    <p className="text-xs text-white/60 mt-0.5">Sector-specific action items for {sectorInfo?.label} operations</p>
                  </div>
                  <div className="p-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {PILLARS.filter((pillar) => getWeightedPillarScore(pillar, active.scores) < 60).map((pillar) => {
                      const score = getWeightedPillarScore(pillar, active.scores);
                      return (
                        <div key={pillar.id} className="rounded-2xl p-5 hover-lift transition bg-white" style={{ border: "1px solid #e2e8f0" }}>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <p className="font-bold text-slate-900 text-sm flex items-center gap-2"><pillar.Icon className="h-4 w-4" style={{ color: "#c4661a" }} strokeWidth={1.75} /> {pillar.title}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold tabular-nums" style={{ background: "rgba(196,102,26,0.1)", color: "#c4661a" }}>{score}%</span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{pillar.strategicRecommendations[active.sector]}</p>
                          <div className="mt-3 pt-3" style={{ borderTop: "1px solid #e2e8f0" }}>
                            <p className="text-xs text-slate-400 italic">{pillar.businessImpact}</p>
                          </div>
                        </div>
                      );
                    })}
                    {PILLARS.every((pillar) => getWeightedPillarScore(pillar, active.scores) >= 60) && (
                      <div className="rounded-2xl p-5 md:col-span-2 xl:col-span-3" style={{ background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", border: "1px solid #bbf7d0" }}>
                        <div className="flex items-center gap-2 mb-2 text-emerald-700"><Sparkles className="h-5 w-5" /><p className="font-black">Strong Performance Across All Dimensions</p></div>
                        <p className="text-sm text-emerald-700 leading-relaxed">Your organisation demonstrates mature AI readiness. Focus now shifts to scaling proven use cases, establishing enterprise-wide governance frameworks, designing sustainable operating models, and implementing comprehensive benefit tracking programmes.</p>
                      </div>
                    )}
                  </div>
                </div>

                {risk.factors.length > 0 && (
                  <div className="rounded-2xl overflow-hidden bg-white shadow-sm" style={{ border: "1px solid #e2e8f0" }}>
                    <div className="px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <h3 className="font-black text-slate-900 flex items-center gap-2 tracking-tight"><AlertTriangle className="h-4 w-4 text-rose-800" strokeWidth={2.2} /> Risk Mitigation Priorities</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Critical factors requiring immediate attention</p>
                    </div>
                    <div className="p-5 grid gap-3 md:grid-cols-2">
                      {risk.factors.map((factor, idx) => (
                        <div key={idx} className="rounded-xl p-3 hover-lift" style={{ background: "#fafafa", border: "1px solid #f1f5f9" }}>
                          <p className="text-sm font-bold text-slate-900">{factor}</p>
                          <p className="text-[10px] text-rose-800 mt-1 font-bold uppercase tracking-widest">Priority: Immediate action required</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </ProGate>
              </TabsContent>

              {/* Sticky bottom tab bar — so users don't scroll back to the top */}
              <div className="sticky bottom-4 z-40 mt-8 mx-auto w-full max-w-2xl animate-fade-in">
                <TabsList className="grid w-full grid-cols-6 rounded-full p-1 h-auto shadow-[0_12px_40px_rgba(0,0,0,0.35)]" style={{ background: "rgba(10,10,10,0.92)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(14px)" }}>
                  {[
                    { value: "assess", label: "Assess", icon: <Target className="h-3.5 w-3.5" /> },
                    { value: "results", label: "Results", icon: <Activity className="h-3.5 w-3.5" /> },
                    { value: "roadmap", label: "Roadmap", icon: <TrendingUp className="h-3.5 w-3.5" /> },
                    { value: "report", label: "Report", icon: <FileText className="h-3.5 w-3.5" /> },
                    { value: "compare", label: "Compare", icon: <Building2 className="h-3.5 w-3.5" /> },
                    { value: "recommendations", label: "Actions", icon: <Sparkles className="h-3.5 w-3.5" /> },
                  ].map((t) => (
                    <TabsTrigger key={t.value} value={t.value} className="flex items-center justify-center gap-1.5 rounded-full text-xs font-semibold py-2.5 transition text-white/60 hover:text-white/90 data-[state=active]:text-black data-[state=active]:bg-white data-[state=active]:shadow-[0_0_16px_rgba(255,255,255,0.25)]" style={{ ["--tw-ring-color" as string]: "transparent" }}>
                      {t.icon}
                      <span className="hidden sm:inline">{t.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareView({ assessments }: { assessments: Assessment[] }) {
  const [leftId, setLeftId] = useState(assessments[0]?.id || "");
  const [rightId, setRightId] = useState(assessments[1]?.id || assessments[0]?.id || "");

  useEffect(() => {
    if (!assessments.some((a) => a.id === leftId)) setLeftId(assessments[0]?.id || "");
    if (!assessments.some((a) => a.id === rightId)) setRightId(assessments[1]?.id || assessments[0]?.id || "");
  }, [assessments, leftId, rightId]);

  const left = assessments.find((a) => a.id === leftId);
  const right = assessments.find((a) => a.id === rightId);

  if (assessments.length < 2) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center" style={{ border: "1px solid #e2e8f0" }}>
        <p className="text-sm text-slate-500">You need at least two saved assessments to use comparison mode.</p>
        <p className="text-xs text-slate-400 mt-1">Create a second assessment to compare results side by side.</p>
      </div>
    );
  }

  if (!left || !right) return null;

  const data = PILLARS.map((pillar) => ({
    pillar: pillar.title,
    left: getWeightedPillarScore(pillar, left.scores),
    right: getWeightedPillarScore(pillar, right.scores),
  }));

  const leftSector = SECTORS.find((s) => s.value === left.sector);
  const rightSector = SECTORS.find((s) => s.value === right.sector);

  return (
    <>
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <h3 className="font-black text-slate-900">Compare Assessments</h3>
          <p className="text-xs text-slate-400 mt-0.5">Benchmark two scorecards side by side using weighted scores</p>
        </div>
        <div className="p-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary</Label>
            <Select value={leftId} onValueChange={setLeftId}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{assessments.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Secondary</Label>
            <Select value={rightId} onValueChange={setRightId}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{assessments.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl p-5" style={{ background: "#e0f2fe", border: "2px solid #0891b2" }}>
          <p className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-1">Primary</p>
          <h3 className="font-black text-sky-900 text-lg">{left.name}</h3>
          <p className="text-sm text-sky-600">{left.businessName || "No organisation set"}{leftSector && ` · ${leftSector.label}`}</p>
          <p className="text-4xl font-black text-sky-700 mt-3">{getWeightedOverallScore(left)}%</p>
          <p className="text-xs text-sky-400 mt-1">Risk: <span className="font-bold capitalize">{getRiskScore(left).level}</span></p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "#f0fdfa", border: "2px solid #0d9488" }}>
          <p className="text-xs font-bold text-teal-500 uppercase tracking-wider mb-1">Secondary</p>
          <h3 className="font-black text-teal-900 text-lg">{right.name}</h3>
          <p className="text-sm text-teal-600">{right.businessName || "No organisation set"}{rightSector && ` · ${rightSector.label}`}</p>
          <p className="text-4xl font-black text-teal-700 mt-3">{getWeightedOverallScore(right)}%</p>
          <p className="text-xs text-teal-400 mt-1">Risk: <span className="font-bold capitalize">{getRiskScore(right).level}</span></p>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <h3 className="font-black text-slate-900">Pillar Comparison</h3>
        </div>
        <div className="p-4 h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="pillar" tick={{ fontSize: 11, fill: "#64748b" }} interval={0} angle={-18} textAnchor="end" height={80} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="left" name="Primary" radius={[8, 8, 0, 0]} fill="#0891b2" />
              <Bar dataKey="right" name="Secondary" radius={[8, 8, 0, 0]} fill="#0d9488" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
