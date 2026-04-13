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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell, PieChart, Pie } from "recharts";
import { Download, Mail, Plus, Printer, Trash2, Copy, Sparkles, AlertTriangle, TrendingUp, Shield, Building2, FileText, Zap, Target, Activity } from "lucide-react";
import jsPDF from "jspdf";

const STORAGE_KEY = "ai-readiness-assessments-v3";
const ACTIVE_KEY = "ai-readiness-active-id-v3";

type ScoreValue = 1 | 2 | 3 | 4 | 5;
type Sector = "retail" | "fm" | "security" | "logistics" | "manufacturing" | "corporate" | "other";
type CompanySize = "small" | "medium" | "large" | "enterprise";
type OperationalComplexity = "low" | "medium" | "high";
type RiskLevel = "low" | "medium" | "high";

type Factor = { 
  id: string; 
  label: string; 
  weight: number; // 1-3 (1=standard, 2=important, 3=critical)
  riskCategory: "operational" | "security" | "compliance" | "strategic";
};

type Pillar = { 
  id: string; 
  title: string; 
  icon: string; 
  description: string; 
  factors: Factor[]; 
  strategicRecommendations: Record<Sector, string>;
  businessImpact: string;
};

type Assessment = {
  id: string;
  name: string;
  businessName: string;
  assessor: string;
  notes: string;
  sector: Sector;
  createdAt: string;
  updatedAt: string;
  scores: Record<string, ScoreValue>;
  // Business Profile
  companySize: CompanySize;
  numberOfSites: string;
  annualRevenue: string;
  operationalComplexity: OperationalComplexity;
};

const SECTORS: { value: Sector; label: string; description: string }[] = [
  { value: "retail", label: "Retail", description: "Consumer-facing, high-volume operations" },
  { value: "fm", label: "Facilities Management", description: "Property, maintenance, and service delivery" },
  { value: "security", label: "Security", description: "Risk-sensitive, compliance-driven operations" },
  { value: "logistics", label: "Logistics", description: "Supply chain and distribution operations" },
  { value: "manufacturing", label: "Manufacturing", description: "Production, assembly, and industrial operations" },
  { value: "corporate", label: "Corporate / Office", description: "Professional services and administrative functions" },
  { value: "other", label: "Other", description: "Specialised or emerging sectors" },
];

const COMPANY_SIZES: { value: CompanySize; label: string; description: string }[] = [
  { value: "small", label: "Small", description: "1-50 employees" },
  { value: "medium", label: "Medium", description: "51-250 employees" },
  { value: "large", label: "Large", description: "251-1000 employees" },
  { value: "enterprise", label: "Enterprise", description: "1000+ employees" },
];

const REVENUE_RANGES = [
  "Under £1M",
  "£1M - £10M",
  "£10M - £50M",
  "£50M - £100M",
  "£100M - £500M",
  "£500M+",
];

const COMPLEXITY_LEVELS: { value: OperationalComplexity; label: string; description: string }[] = [
  { value: "low", label: "Low", description: "Single site, straightforward operations" },
  { value: "medium", label: "Medium", description: "Multiple sites, moderate integration needs" },
  { value: "high", label: "High", description: "Complex multi-site, highly integrated operations" },
];

const SCALE: Record<ScoreValue, string> = {
  1: "Not started",
  2: "Early stage",
  3: "Developing",
  4: "Established",
  5: "Optimised",
};

const PILLARS: Pillar[] = [
  {
    id: "strategy",
    title: "Strategy & Leadership",
    icon: "🎯",
    description: "Clarity of vision, sponsorship and measurable AI outcomes.",
    businessImpact: "Strategic alignment directly impacts ROI realisation speed and stakeholder confidence.",
    strategicRecommendations: {
      retail: "Establish AI governance aligned with customer experience KPIs and seasonal demand patterns. Define clear ownership for AI initiatives across merchandising, supply chain, and customer engagement functions.",
      fm: "Create an AI roadmap that prioritises asset lifecycle optimisation and predictive maintenance. Ensure executive sponsorship covers both operational efficiency and compliance requirements.",
      security: "Develop AI strategy with embedded risk management and regulatory compliance frameworks. Establish clear escalation paths and accountability for AI-driven security decisions.",
      logistics: "Align AI vision with end-to-end supply chain visibility and demand forecasting goals. Secure executive buy-in for cross-functional data sharing and automation initiatives.",
      manufacturing: "Build AI strategy around production optimisation, quality control, and supply chain resilience. Establish governance that balances innovation speed with operational safety requirements.",
      corporate: "Align AI initiatives with workforce productivity and knowledge management objectives. Ensure governance frameworks address data privacy and intellectual property considerations.",
      other: "Define a clear AI roadmap tied to measurable business outcomes with quarterly value tracking. Establish cross-functional governance and ownership structures.",
    },
    factors: [
      { id: "strategy_vision", label: "Clear AI vision and target outcomes", weight: 3, riskCategory: "strategic" },
      { id: "strategy_exec", label: "Executive sponsorship and governance", weight: 3, riskCategory: "strategic" },
      { id: "strategy_roi", label: "Use cases linked to ROI or risk reduction", weight: 2, riskCategory: "strategic" },
      { id: "strategy_policy", label: "Policies for responsible AI use", weight: 2, riskCategory: "compliance" },
    ],
  },
  {
    id: "people",
    title: "People & Capability",
    icon: "👥",
    description: "Skills, confidence, change readiness and cross-functional adoption.",
    businessImpact: "Workforce readiness determines adoption velocity and sustainable competitive advantage.",
    strategicRecommendations: {
      retail: "Invest in AI literacy for store managers and customer-facing teams. Build capabilities in customer analytics and personalisation across marketing and merchandising functions.",
      fm: "Develop technical competencies in IoT and predictive analytics among operations teams. Create cross-training programmes between facility managers and data analysts.",
      security: "Establish specialised training in AI ethics and bias detection for security personnel. Build capabilities in threat pattern recognition and anomaly detection.",
      logistics: "Upskill warehouse and transport teams in AI-assisted decision making. Develop data science capabilities focused on demand forecasting and route optimisation.",
      manufacturing: "Build competencies in predictive maintenance and quality analytics. Develop cross-functional teams combining operational expertise with data science capabilities.",
      corporate: "Establish AI literacy programmes for knowledge workers. Build capabilities in document automation, workflow optimisation, and data-driven decision support.",
      other: "Implement a structured enablement plan covering AI awareness, champion networks, and role-based skills development pathways.",
    },
    factors: [
      { id: "people_awareness", label: "Workforce awareness of AI opportunities", weight: 2, riskCategory: "operational" },
      { id: "people_skills", label: "Access to AI skills or partners", weight: 3, riskCategory: "operational" },
      { id: "people_change", label: "Change readiness and stakeholder buy-in", weight: 2, riskCategory: "operational" },
      { id: "people_champions", label: "Named champions or product owners", weight: 2, riskCategory: "strategic" },
    ],
  },
  {
    id: "process",
    title: "Process & Operations",
    icon: "⚙️",
    description: "Suitability of workflows for automation, augmentation and measurement.",
    businessImpact: "Process maturity determines automation potential and time-to-value for AI investments.",
    strategicRecommendations: {
      retail: "Map customer journey touchpoints for AI augmentation opportunities. Standardise inventory and demand planning processes to enable predictive capabilities.",
      fm: "Document maintenance workflows and establish baseline metrics for work order completion. Create standardised processes for asset condition assessment and service delivery.",
      security: "Establish documented incident response workflows with clear decision points. Standardise threat assessment and access control processes for AI integration.",
      logistics: "Map end-to-end logistics workflows from order to delivery. Establish standardised processes for carrier selection, route planning, and exception handling.",
      manufacturing: "Document production workflows and establish quality control baselines. Standardise equipment monitoring and maintenance scheduling processes.",
      corporate: "Map knowledge work processes and identify automation opportunities. Standardise document workflows and approval chains for AI-assisted processing.",
      other: "Identify highest-friction processes and prioritise quick wins with measurable time and cost savings. Document workflows to enable consistent AI implementation.",
    },
    factors: [
      { id: "process_manual", label: "Manual, repetitive workflows identified", weight: 2, riskCategory: "operational" },
      { id: "process_standard", label: "Processes are documented and standardised", weight: 3, riskCategory: "operational" },
      { id: "process_metrics", label: "Operational baselines and KPIs exist", weight: 2, riskCategory: "operational" },
      { id: "process_pipeline", label: "Delivery process for piloting and scaling", weight: 2, riskCategory: "strategic" },
    ],
  },
  {
    id: "data",
    title: "Data & Insight",
    icon: "📊",
    description: "Data availability, quality, ownership and accessibility.",
    businessImpact: "Data foundation quality directly correlates with AI model accuracy and business decision confidence.",
    strategicRecommendations: {
      retail: "Consolidate customer data across touchpoints and establish a unified customer view. Prioritise POS, inventory, and customer behaviour data quality initiatives.",
      fm: "Centralise asset and maintenance data from disparate systems. Establish IoT data pipelines for real-time condition monitoring and predictive analytics.",
      security: "Implement secure data governance with audit trails and access logging. Establish real-time threat intelligence data feeds and incident correlation databases.",
      logistics: "Create unified visibility across shipment, inventory, and carrier data. Establish real-time tracking data integration and demand signal repositories.",
      manufacturing: "Integrate production line data with quality metrics and supply chain systems. Establish real-time sensor data pipelines and equipment performance databases.",
      corporate: "Consolidate document repositories and establish knowledge management foundations. Prioritise structured data from HR, finance, and operational systems.",
      other: "Conduct a comprehensive data audit to identify trusted sources, ownership gaps, and the fastest path to production-ready data products.",
    },
    factors: [
      { id: "data_quality", label: "Data quality is trusted", weight: 3, riskCategory: "operational" },
      { id: "data_access", label: "Data is accessible across teams/tools", weight: 2, riskCategory: "operational" },
      { id: "data_governance", label: "Ownership and governance are clear", weight: 3, riskCategory: "compliance" },
      { id: "data_structure", label: "Sufficient structured data for use cases", weight: 2, riskCategory: "operational" },
    ],
  },
  {
    id: "tech",
    title: "Technology & Integration",
    icon: "🧩",
    description: "Tooling, interoperability, security and production readiness.",
    businessImpact: "Technology infrastructure determines scalability potential and total cost of AI ownership.",
    strategicRecommendations: {
      retail: "Evaluate e-commerce and POS platform API capabilities for AI integration. Ensure cloud infrastructure supports real-time personalisation and demand sensing workloads.",
      fm: "Assess building management system integration capabilities. Ensure IoT platform scalability and edge computing readiness for predictive maintenance.",
      security: "Validate security platform interoperability and zero-trust architecture alignment. Ensure AI systems meet regulatory requirements for data handling and audit compliance.",
      logistics: "Evaluate TMS and WMS integration capabilities for AI optimisation. Ensure real-time tracking infrastructure supports machine learning model deployment.",
      manufacturing: "Assess MES and ERP integration capabilities for AI deployment. Ensure edge computing infrastructure supports real-time quality control and predictive maintenance.",
      corporate: "Evaluate productivity platform integration opportunities. Ensure document management and workflow systems support AI-assisted processing.",
      other: "Audit technology stack for integration pathways, security constraints, and low-code or API-led delivery opportunities.",
    },
    factors: [
      { id: "tech_stack", label: "Modern tooling and platform fit", weight: 2, riskCategory: "operational" },
      { id: "tech_api", label: "API/integration capability", weight: 2, riskCategory: "operational" },
      { id: "tech_security", label: "Security and access controls in place", weight: 3, riskCategory: "security" },
      { id: "tech_scale", label: "Ability to move from pilot to scale", weight: 2, riskCategory: "strategic" },
    ],
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function makeBlankAssessment(name = "New Assessment"): Assessment {
  const scores: Record<string, ScoreValue> = {};
  PILLARS.forEach((pillar) => pillar.factors.forEach((factor) => (scores[factor.id] = 2)));
  const now = new Date().toISOString();
  return {
    id: uid(),
    name,
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

// Weighted scoring calculation
function getWeightedPillarScore(pillar: Pillar, scores: Record<string, ScoreValue>) {
  let totalWeight = 0;
  let weightedSum = 0;
  
  pillar.factors.forEach((factor) => {
    const score = scores[factor.id] ?? 2;
    weightedSum += (score - 1) * factor.weight; // Normalize to 0-4 range
    totalWeight += factor.weight * 4; // Max possible weighted score
  });
  
  return Math.round((weightedSum / totalWeight) * 100);
}

function getWeightedOverallScore(assessment: Assessment) {
  let totalWeight = 0;
  let weightedSum = 0;
  
  PILLARS.forEach((pillar) => {
    pillar.factors.forEach((factor) => {
      const score = assessment.scores[factor.id] ?? 2;
      weightedSum += (score - 1) * factor.weight;
      totalWeight += factor.weight * 4;
    });
  });
  
  return Math.round((weightedSum / totalWeight) * 100);
}

// Risk-based scoring
function getRiskScore(assessment: Assessment): { level: RiskLevel; score: number; factors: string[] } {
  const riskFactors: string[] = [];
  let riskScore = 0;
  
  PILLARS.forEach((pillar) => {
    pillar.factors.forEach((factor) => {
      const score = assessment.scores[factor.id] ?? 2;
      
      // Critical factors with low scores increase risk significantly
      if (factor.weight === 3 && score <= 2) {
        riskScore += 25;
        riskFactors.push(factor.label);
      } else if (factor.weight === 2 && score <= 2) {
        riskScore += 10;
      }
      
      // Security and compliance categories carry higher risk weight
      if ((factor.riskCategory === "security" || factor.riskCategory === "compliance") && score <= 2) {
        riskScore += 15;
        if (!riskFactors.includes(factor.label)) {
          riskFactors.push(factor.label);
        }
      }
    });
  });
  
  const level: RiskLevel = riskScore >= 60 ? "high" : riskScore >= 30 ? "medium" : "low";
  return { level, score: Math.min(riskScore, 100), factors: riskFactors.slice(0, 5) };
}

// Business impact assessment
function getBusinessImpact(assessment: Assessment): { category: string; description: string; color: string } {
  const overall = getWeightedOverallScore(assessment);
  const risk = getRiskScore(assessment);
  
  if (overall >= 70 && risk.level === "low") {
    return {
      category: "High Value Opportunity",
      description: "Organisation is well-positioned to accelerate AI adoption with strong foundations. Focus on scaling proven use cases and measuring business outcomes.",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  } else if (overall >= 50 && risk.level !== "high") {
    return {
      category: "Strategic Investment Required",
      description: "Solid foundations exist but targeted investments in capability gaps will unlock significant value. Prioritise high-impact, lower-risk initiatives first.",
      color: "text-blue-700 bg-blue-50 border-blue-200",
    };
  } else if (risk.level === "high") {
    return {
      category: "Risk Mitigation Priority",
      description: "Significant operational and compliance risks must be addressed before scaling AI initiatives. Focus on governance, security, and foundational capabilities.",
      color: "text-red-700 bg-red-50 border-red-200",
    };
  } else {
    return {
      category: "Foundation Building Phase",
      description: "Organisation is in early stages of AI readiness. Recommend phased approach starting with strategy definition, data foundations, and capability building.",
      color: "text-amber-700 bg-amber-50 border-amber-200",
    };
  }
}

// Operational Impact Score
function getOperationalImpactScore(assessment: Assessment): number {
  const processScore = getWeightedPillarScore(PILLARS.find((p) => p.id === "process")!, assessment.scores);
  const techScore = getWeightedPillarScore(PILLARS.find((p) => p.id === "tech")!, assessment.scores);
  const dataScore = getWeightedPillarScore(PILLARS.find((p) => p.id === "data")!, assessment.scores);
  
  // Weighted average with process having highest impact
  return Math.round((processScore * 0.4 + techScore * 0.3 + dataScore * 0.3));
}

// Efficiency Opportunity Score
function getEfficiencyOpportunityScore(assessment: Assessment): number {
  const overall = getWeightedOverallScore(assessment);
  const processScore = getWeightedPillarScore(PILLARS.find((p) => p.id === "process")!, assessment.scores);
  
  // Lower current scores mean higher opportunity for improvement
  const opportunityGap = 100 - overall;
  const processGap = 100 - processScore;
  
  // Combine gaps with current capability to estimate realistic opportunity
  return Math.round((opportunityGap * 0.5 + processGap * 0.3 + (overall * 0.2)));
}

// Risk Exposure Score (0-100, higher = more exposed)
function getRiskExposureScore(assessment: Assessment): number {
  const risk = getRiskScore(assessment);
  const securityFactor = PILLARS.find((p) => p.id === "tech")!.factors.find((f) => f.id === "tech_security")!;
  const securityScore = assessment.scores[securityFactor.id] ?? 2;
  const governanceFactor = PILLARS.find((p) => p.id === "data")!.factors.find((f) => f.id === "data_governance")!;
  const governanceScore = assessment.scores[governanceFactor.id] ?? 2;
  
  // Combine risk score with security and governance gaps
  const securityGap = (5 - securityScore) * 10;
  const governanceGap = (5 - governanceScore) * 10;
  
  return Math.min(100, Math.round(risk.score * 0.5 + securityGap * 0.25 + governanceGap * 0.25));
}

// AI Opportunities
function getTopOpportunities(assessment: Assessment): { title: string; description: string; impact: string }[] {
  const sector = assessment.sector;
  const processScore = getWeightedPillarScore(PILLARS.find((p) => p.id === "process")!, assessment.scores);
  const dataScore = getWeightedPillarScore(PILLARS.find((p) => p.id === "data")!, assessment.scores);
  const techScore = getWeightedPillarScore(PILLARS.find((p) => p.id === "tech")!, assessment.scores);
  
  const opportunities: { title: string; description: string; impact: string; score: number }[] = [];
  
  // Sector-specific opportunities
  const sectorOpportunities: Record<Sector, { title: string; description: string; impact: string }[]> = {
    retail: [
      { title: "Customer Experience Personalisation", description: "AI-driven recommendations and targeted engagement", impact: "10-15% revenue uplift" },
      { title: "Demand Forecasting", description: "Predictive inventory and supply chain optimisation", impact: "20-30% stock reduction" },
      { title: "Automated Customer Service", description: "Intelligent chatbots and self-service automation", impact: "40-60% query resolution" },
    ],
    fm: [
      { title: "Predictive Maintenance", description: "AI-driven asset failure prediction and scheduling", impact: "25-40% maintenance cost reduction" },
      { title: "Energy Optimisation", description: "Smart building management and consumption analytics", impact: "15-25% energy savings" },
      { title: "Workforce Scheduling", description: "AI-optimised resource allocation and routing", impact: "15-20% productivity gain" },
    ],
    security: [
      { title: "Threat Detection Automation", description: "Real-time anomaly detection and alert prioritisation", impact: "50-70% faster response" },
      { title: "Access Control Intelligence", description: "Behavioural analytics and adaptive authentication", impact: "30-50% incident reduction" },
      { title: "Compliance Automation", description: "Automated audit trails and regulatory reporting", impact: "60-80% compliance effort reduction" },
    ],
    logistics: [
      { title: "Route Optimisation", description: "AI-powered delivery scheduling and fleet management", impact: "15-25% fuel cost reduction" },
      { title: "Demand Sensing", description: "Predictive inventory positioning and replenishment", impact: "20-35% inventory optimisation" },
      { title: "Warehouse Automation", description: "Intelligent picking, packing, and space utilisation", impact: "25-40% throughput increase" },
    ],
    manufacturing: [
      { title: "Quality Control Automation", description: "Computer vision and predictive quality analytics", impact: "30-50% defect reduction" },
      { title: "Production Optimisation", description: "AI-driven scheduling and yield improvement", impact: "10-20% throughput increase" },
      { title: "Predictive Maintenance", description: "Equipment failure prediction and scheduling", impact: "25-40% downtime reduction" },
    ],
    corporate: [
      { title: "Document Processing Automation", description: "Intelligent extraction and workflow automation", impact: "50-70% processing time reduction" },
      { title: "Knowledge Management", description: "AI-powered search and expertise discovery", impact: "20-30% productivity gain" },
      { title: "Meeting and Communication Intelligence", description: "Automated summaries and action tracking", impact: "15-25% time savings" },
    ],
    other: [
      { title: "Process Automation", description: "AI-driven workflow optimisation and task automation", impact: "20-40% efficiency gain" },
      { title: "Data-Driven Decision Making", description: "Predictive analytics and business intelligence", impact: "15-25% decision quality improvement" },
      { title: "Customer Engagement", description: "Personalisation and automated communication", impact: "10-20% engagement uplift" },
    ],
  };
  
  // Add sector opportunities with scoring based on current readiness
  // Fallback to "other" if sector not found (handles legacy "general" values)
  const sectorKey = sectorOpportunities[sector] ? sector : "other";
  sectorOpportunities[sectorKey].forEach((opp, idx) => {
    const relevanceScore = idx === 0 ? (100 - processScore) : idx === 1 ? (100 - dataScore) : (100 - techScore);
    opportunities.push({ ...opp, score: relevanceScore });
  });
  
  return opportunities.sort((a, b) => b.score - a.score).slice(0, 3).map(({ title, description, impact }) => ({ title, description, impact }));
}

// Top Risks if no action taken
function getTopRisks(assessment: Assessment): { title: string; description: string; severity: string }[] {
  const overall = getWeightedOverallScore(assessment);
  const risk = getRiskScore(assessment);
  const sector = assessment.sector;
  
  const risks: { title: string; description: string; severity: string; score: number }[] = [];
  
  // Universal risks based on low scores
  if (overall < 40) {
    risks.push({ title: "Competitive Displacement", description: "Competitors leveraging AI may capture market share and customer preference", severity: "High", score: 90 });
  }
  if (overall < 60) {
    risks.push({ title: "Talent Attraction Gap", description: "Difficulty attracting and retaining talent seeking modern, AI-enabled workplaces", severity: "Medium", score: 60 });
  }
  
  // Sector-specific risks
  const sectorRisks: Record<Sector, { title: string; description: string; severity: string }[]> = {
    retail: [
      { title: "Customer Experience Gap", description: "Inability to deliver personalised experiences expected by modern consumers", severity: "High" },
      { title: "Inventory Inefficiency", description: "Continued stock-outs and overstock situations impacting margins", severity: "Medium" },
    ],
    fm: [
      { title: "Asset Failure Costs", description: "Reactive maintenance leading to higher costs and service disruption", severity: "High" },
      { title: "Energy Cost Exposure", description: "Inability to optimise consumption in volatile energy markets", severity: "Medium" },
    ],
    security: [
      { title: "Threat Response Delay", description: "Manual processes unable to match speed of evolving threats", severity: "High" },
      { title: "Compliance Exposure", description: "Increased regulatory scrutiny and potential penalties", severity: "High" },
    ],
    logistics: [
      { title: "Service Level Degradation", description: "Inability to meet customer delivery expectations", severity: "High" },
      { title: "Cost Competitiveness", description: "Higher operational costs compared to AI-enabled competitors", severity: "Medium" },
    ],
    manufacturing: [
      { title: "Quality and Yield Loss", description: "Continued defects and waste without predictive quality controls", severity: "High" },
      { title: "Production Downtime", description: "Unplanned equipment failures disrupting output", severity: "High" },
    ],
    corporate: [
      { title: "Productivity Stagnation", description: "Manual processes limiting workforce efficiency gains", severity: "Medium" },
      { title: "Knowledge Loss", description: "Institutional knowledge not captured or leveraged effectively", severity: "Medium" },
    ],
    other: [
      { title: "Operational Inefficiency", description: "Manual processes consuming resources that could be automated", severity: "Medium" },
      { title: "Decision Quality", description: "Decisions based on incomplete or delayed information", severity: "Medium" },
    ],
  };
  
  // Fallback to "other" if sector not found (handles legacy "general" values)
  const riskSectorKey = sectorRisks[sector] ? sector : "other";
  sectorRisks[riskSectorKey].forEach((r, idx) => {
    risks.push({ ...r, score: 70 - idx * 10 });
  });
  
  // Risk-based additions
  if (risk.level === "high") {
    risks.push({ title: "Governance and Compliance Risk", description: "Lack of AI governance may lead to regulatory issues or reputational damage", severity: "High", score: 85 });
  }
  
  return risks.sort((a, b) => b.score - a.score).slice(0, 3).map(({ title, description, severity }) => ({ title, description, severity }));
}

// ROI opportunity estimation with scenarios
function getROIOpportunity(assessment: Assessment): { range: string; confidence: string; drivers: string[]; scenarios: { low: string; mid: string; high: string } } {
  const overall = getWeightedOverallScore(assessment);
  const risk = getRiskScore(assessment);
  
  const processScore = getWeightedPillarScore(PILLARS.find((p) => p.id === "process")!, assessment.scores);
  const dataScore = getWeightedPillarScore(PILLARS.find((p) => p.id === "data")!, assessment.scores);
  
  const drivers: string[] = [];
  
  if (processScore >= 50) drivers.push("Process automation potential");
  if (dataScore >= 50) drivers.push("Data-driven decision making");
  if (overall >= 60) drivers.push("Operational efficiency gains");
  if (risk.level === "low") drivers.push("Reduced compliance and security costs");
  
  if (overall >= 70 && risk.level === "low") {
    return { 
      range: "15-25%", 
      confidence: "High", 
      drivers: drivers.length ? drivers : ["Strong foundational readiness"],
      scenarios: { low: "12%", mid: "18%", high: "25%" }
    };
  } else if (overall >= 50) {
    return { 
      range: "8-15%", 
      confidence: "Medium", 
      drivers: drivers.length ? drivers : ["Moderate improvement potential"],
      scenarios: { low: "5%", mid: "10%", high: "15%" }
    };
  } else {
    return { 
      range: "3-8%", 
      confidence: "Low", 
      drivers: ["Foundation building required before significant ROI"],
      scenarios: { low: "2%", mid: "5%", high: "8%" }
    };
  }
}

function getBand(score: number) {
  if (score >= 80) return { label: "Advanced", advice: "Organisation demonstrates mature AI capabilities across all dimensions. Ready for scaled deployment and enterprise-wide transformation.", tone: "bg-emerald-500/10 text-emerald-700 border-emerald-200" };
  if (score >= 60) return { label: "Progressing", advice: "Good momentum with established capabilities in key areas. Focus on consistency and addressing remaining gaps to unlock full potential.", tone: "bg-blue-500/10 text-blue-700 border-blue-200" };
  if (score >= 40) return { label: "Emerging", advice: "Foundations are forming but capability remains uneven. Targeted investment in weak areas will accelerate readiness.", tone: "bg-amber-500/10 text-amber-700 border-amber-200" };
  return { label: "Early", advice: "Organisation is in early stages of AI readiness. A structured approach to strategy, data, and capability building is recommended.", tone: "bg-red-500/10 text-red-700 border-red-200" };
}

function generateExecutiveSummary(assessment: Assessment): string {
  const overall = getWeightedOverallScore(assessment);
  const band = getBand(overall);
  const risk = getRiskScore(assessment);
  const impact = getBusinessImpact(assessment);
  const roi = getROIOpportunity(assessment);
  const sector = SECTORS.find((s) => s.value === assessment.sector);
  
  const pillarScores = PILLARS.map((p) => ({
    name: p.title,
    score: getWeightedPillarScore(p, assessment.scores),
  })).sort((a, b) => b.score - a.score);
  
  const strongest = pillarScores[0];
  const weakest = pillarScores[pillarScores.length - 1];
  
  const companySize = COMPANY_SIZES.find((s) => s.value === assessment.companySize);
  const complexity = COMPLEXITY_LEVELS.find((c) => c.value === assessment.operationalComplexity);
  const topOpps = getTopOpportunities(assessment);
  const topRisks = getTopRisks(assessment);
  
  return `Executive Summary: AI Transformation Readiness Assessment

Organisation: ${assessment.businessName || "Not specified"}
Sector: ${sector?.label || "General"}
Assessment Date: ${new Date(assessment.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}

Business Profile:
- Company Size: ${companySize?.label || "Not specified"} (${companySize?.description || ""})
- Sites/Locations: ${assessment.numberOfSites || "Not specified"}
- Annual Revenue: ${assessment.annualRevenue || "Not specified"}
- Operational Complexity: ${complexity?.label || "Not specified"}

Overall Readiness: ${overall}% (${band.label})

${assessment.businessName || "The organisation"} demonstrates ${band.label.toLowerCase()} AI readiness with an overall score of ${overall}%. ${band.advice}

Risk Profile: ${risk.level.charAt(0).toUpperCase() + risk.level.slice(1)} Risk
${risk.level === "high" ? "Critical attention required in: " + risk.factors.slice(0, 3).join(", ") + "." : risk.level === "medium" ? "Moderate risks identified that should be addressed in the near term." : "Risk posture is well-managed with no critical gaps identified."}

Business Impact Assessment: ${impact.category}
${impact.description}

ROI Opportunity:
- Conservative Scenario: ${roi.scenarios.low}
- Moderate Scenario: ${roi.scenarios.mid}
- Optimistic Scenario: ${roi.scenarios.high}
Confidence Level: ${roi.confidence}
Key Value Drivers: ${roi.drivers.join(", ")}

Top 3 AI Opportunities:
${topOpps.map((o, i) => `${i + 1}. ${o.title} - ${o.impact}`).join("\n")}

Top 3 Risks if No Action Taken:
${topRisks.map((r, i) => `${i + 1}. ${r.title} (${r.severity})`).join("\n")}

Capability Highlights:
- Strongest Area: ${strongest.name} (${strongest.score}%)
- Priority Development Area: ${weakest.name} (${weakest.score}%)

Strategic Recommendation:
${overall >= 70 ? "The organisation is well-positioned to accelerate AI adoption. Recommend focusing on scaling proven use cases, establishing enterprise governance, and measuring business outcomes systematically." : overall >= 50 ? "Solid foundations exist for AI transformation. Recommend targeted investments in identified capability gaps while pursuing high-impact, lower-risk pilot initiatives." : "A structured, phased approach to AI readiness is recommended. Priority should be given to establishing strategic alignment, building data foundations, and developing core capabilities before pursuing scaled AI initiatives."}

This assessment provides a point-in-time view of AI readiness and should be reviewed quarterly as capabilities evolve.`;
}

function exportPdf(assessment: Assessment) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const overall = getWeightedOverallScore(assessment);
  const band = getBand(overall);
  const risk = getRiskScore(assessment);
  const impact = getBusinessImpact(assessment);
  const roi = getROIOpportunity(assessment);
  const sector = SECTORS.find((s) => s.value === assessment.sector);
  
  let y = 18;
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("AI Transformation Readiness Report", 16, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(assessment.businessName || "Organisation not specified", 16, 26);
  doc.setFontSize(9);
  doc.text(`Sector: ${sector?.label || "General"} | Assessed by: ${assessment.assessor || "Not specified"}`, 16, 33);
  
  y = 52;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Executive Summary", 16, y);
  y += 8;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Overall Readiness Score: ${overall}% (${band.label})`, 16, y);
  y += 6;
  doc.text(`Risk Level: ${risk.level.charAt(0).toUpperCase() + risk.level.slice(1)}`, 16, y);
  y += 6;
  doc.text(`Business Impact: ${impact.category}`, 16, y);
  y += 6;
  doc.text(`ROI Opportunity: ${roi.range} (${roi.confidence} confidence)`, 16, y);
  y += 10;
  
  doc.setFont("helvetica", "bold");
  doc.text("Pillar Scores (Weighted)", 16, y);
  y += 6;
  
  PILLARS.forEach((pillar) => {
    doc.setFont("helvetica", "normal");
    doc.text(`${pillar.title}: ${getWeightedPillarScore(pillar, assessment.scores)}%`, 16, y);
    y += 5;
  });
  
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Strategic Recommendations", 16, y);
  y += 6;
  
  PILLARS.filter((p) => getWeightedPillarScore(p, assessment.scores) < 50).forEach((pillar) => {
    const rec = pillar.strategicRecommendations[assessment.sector];
    const lines = doc.splitTextToSize(`${pillar.title}: ${rec}`, 175);
    doc.setFont("helvetica", "normal");
    doc.text(lines, 16, y);
    y += lines.length * 4.5 + 3;
  });
  
  if (assessment.notes.trim()) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Additional Notes", 16, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(assessment.notes, 175), 16, y);
  }
  
  const safeName = `${assessment.businessName || "business"}-${assessment.name}`.replace(/[^a-z0-9]+/gi, "-");
  doc.save(`AI-Readiness-Report-${safeName}.pdf`);
}

function mailTo(assessment: Assessment) {
  const overall = getWeightedOverallScore(assessment);
  const band = getBand(overall);
  const risk = getRiskScore(assessment);
  const impact = getBusinessImpact(assessment);
  const roi = getROIOpportunity(assessment);
  const sector = SECTORS.find((s) => s.value === assessment.sector);
  
  const body = encodeURIComponent([
    `AI Transformation Readiness Report`,
    ``,
    `Organisation: ${assessment.businessName || "N/A"}`,
    `Sector: ${sector?.label || "General"}`,
    `Assessment: ${assessment.name}`,
    `Assessor: ${assessment.assessor || "N/A"}`,
    ``,
    `Overall Score: ${overall}% (${band.label})`,
    `Risk Level: ${risk.level.charAt(0).toUpperCase() + risk.level.slice(1)}`,
    `Business Impact: ${impact.category}`,
    `ROI Opportunity: ${roi.range}`,
    ``,
    `Pillar Scores:`,
    ...PILLARS.map((p) => `- ${p.title}: ${getWeightedPillarScore(p, assessment.scores)}%`),
    ``,
    `Key Recommendations:`,
    ...PILLARS.filter((p) => getWeightedPillarScore(p, assessment.scores) < 50).map((p) => `- ${p.title}: ${p.strategicRecommendations[assessment.sector]}`),
    assessment.notes ? `` : ``,
    assessment.notes ? `Notes: ${assessment.notes}` : ``,
  ].filter(Boolean).join("\n"));
  
  window.location.href = `mailto:?subject=${encodeURIComponent(`AI Readiness Report - ${assessment.businessName || assessment.name}`)}&body=${body}`;
}

function scoreLabel(value: ScoreValue) {
  return `${value} - ${SCALE[value]}`;
}

function getWeightLabel(weight: number) {
  if (weight === 3) return { label: "Critical", color: "bg-red-100 text-red-700" };
  if (weight === 2) return { label: "Important", color: "bg-amber-100 text-amber-700" };
  return { label: "Standard", color: "bg-slate-100 text-slate-600" };
}

export default function AIReadinessScorecardApp() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [tab, setTab] = useState("assess");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    const active = localStorage.getItem(ACTIVE_KEY);
    if (stored) {
      const parsed: Assessment[] = JSON.parse(stored);
      setAssessments(parsed);
      setActiveId(active && parsed.some((a) => a.id === active) ? active : parsed[0]?.id || "");
    } else {
      const first = makeBlankAssessment();
      setAssessments([first]);
      setActiveId(first.id);
    }
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
    const next = makeBlankAssessment(`Assessment ${assessments.length + 1}`);
    setAssessments((curr) => [...curr, next]);
    setActiveId(next.id);
    setTab("assess");
  };

  const duplicate = () => {
    if (!active) return;
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

  if (!mounted || !active) return null;

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">AI Readiness</Badge>
              <Badge variant="outline">Enterprise Assessment</Badge>
              {sectorInfo && <Badge className="bg-slate-900 text-white">{sectorInfo.label}</Badge>}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">AI Transformation Readiness Assessment</h1>
            <p className="mt-1 text-sm text-slate-600">Enterprise-grade assessment with weighted scoring, risk analysis, and strategic recommendations.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={createNew}><Plus className="mr-2 h-4 w-4" />New</Button>
            <Button variant="outline" onClick={duplicate}><Copy className="mr-2 h-4 w-4" />Duplicate</Button>
            <Button variant="outline" onClick={() => exportPdf(active)}><Download className="mr-2 h-4 w-4" />PDF</Button>
            <Button variant="outline" onClick={() => mailTo(active)}><Mail className="mr-2 h-4 w-4" />Email</Button>
            <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
          </div>
        </div>

        {/* Sidebar + Summary Cards */}
        <div className="mb-6 grid gap-4 lg:grid-cols-[320px,1fr]">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">Assessments</CardTitle>
              <CardDescription>Switch, manage and compare saved scorecards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {assessments.map((item) => {
                const itemOverall = getWeightedOverallScore(item);
                const itemSector = SECTORS.find((s) => s.value === item.sector);
                return (
                  <div key={item.id} className={`rounded-2xl border p-3 transition ${item.id === active.id ? "border-slate-900 bg-slate-50" : "bg-white"}`}>
                    <button className="w-full text-left" onClick={() => setActiveId(item.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{item.name}</p>
                          <p className="truncate text-xs text-slate-500">{item.businessName || "No organisation set"}</p>
                          {itemSector && <Badge variant="outline" className="mt-1 text-xs">{itemSector.label}</Badge>}
                        </div>
                        <Badge variant="secondary">{itemOverall}%</Badge>
                      </div>
                    </button>
                    <div className="mt-3 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => removeAssessment(item.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-3xl">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />AI Maturity Score</CardDescription>
                <CardTitle className="text-3xl">{overall}%</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={overall} className="h-3" />
                <p className="mt-2 text-xs text-slate-500">Band: {band.label}</p>
              </CardContent>
            </Card>
            
            <Card className="rounded-3xl">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><Activity className="h-4 w-4" />Operational Impact</CardDescription>
                <CardTitle className="text-3xl">{operationalImpact}%</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={operationalImpact} className="h-3" />
                <p className="mt-2 text-xs text-slate-500">Process & tech readiness</p>
              </CardContent>
            </Card>
            
            <Card className="rounded-3xl">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><Zap className="h-4 w-4" />Efficiency Opportunity</CardDescription>
                <CardTitle className="text-3xl">{efficiencyOpportunity}%</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={efficiencyOpportunity} className="h-3" />
                <p className="mt-2 text-xs text-slate-500">Improvement potential</p>
              </CardContent>
            </Card>
            
            <Card className={`rounded-3xl border-2 ${riskExposure >= 60 ? "border-red-200 bg-red-50/50" : riskExposure >= 30 ? "border-amber-200 bg-amber-50/50" : "border-emerald-200 bg-emerald-50/50"}`}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Risk Exposure</CardDescription>
                <CardTitle className={`text-3xl ${riskExposure >= 60 ? "text-red-700" : riskExposure >= 30 ? "text-amber-700" : "text-emerald-700"}`}>
                  {riskExposure}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={riskExposure} className="h-3" />
                <p className="mt-2 text-xs text-slate-600">{risk.level.charAt(0).toUpperCase() + risk.level.slice(1)} risk level</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 rounded-2xl">
            <TabsTrigger value="assess">Assess</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="report">Report</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
            <TabsTrigger value="recommendations">Actions</TabsTrigger>
          </TabsList>

          {/* ASSESS TAB */}
          <TabsContent value="assess" className="space-y-4">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Assessment Details</CardTitle>
                <CardDescription>Set the context for this scorecard and then complete the pillar questions below.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Assessment Name</Label>
                  <Input value={active.name} onChange={(e) => updateActive({ name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Organisation</Label>
                  <Input value={active.businessName} onChange={(e) => updateActive({ businessName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Assessor</Label>
                  <Input value={active.assessor} onChange={(e) => updateActive({ assessor: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Sector</Label>
                  <Select value={active.sector} onValueChange={(value: Sector) => updateActive({ sector: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((sector) => (
                        <SelectItem key={sector.value} value={sector.value}>
                          <div>
                            <div className="font-medium">{sector.label}</div>
                            <div className="text-xs text-slate-500">{sector.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2 lg:col-span-4">
                  <Label>Notes</Label>
                  <Textarea value={active.notes} onChange={(e) => updateActive({ notes: e.target.value })} placeholder="Context, assumptions, known blockers, target operating model notes..." />
                </div>
              </CardContent>
            </Card>

            {/* Business Profile */}
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>Organisation context that influences AI readiness interpretation and recommendations.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Company Size</Label>
                  <Select value={active.companySize} onValueChange={(value: CompanySize) => updateActive({ companySize: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          <div>
                            <div className="font-medium">{size.label}</div>
                            <div className="text-xs text-slate-500">{size.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Number of Sites / Locations</Label>
                  <Input value={active.numberOfSites} onChange={(e) => updateActive({ numberOfSites: e.target.value })} placeholder="e.g. 25 sites" />
                </div>
                <div className="space-y-2">
                  <Label>Annual Revenue Range</Label>
                  <Select value={active.annualRevenue} onValueChange={(value) => updateActive({ annualRevenue: value })}>
                    <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                    <SelectContent>
                      {REVENUE_RANGES.map((range) => (
                        <SelectItem key={range} value={range}>{range}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Operational Complexity</Label>
                  <Select value={active.operationalComplexity} onValueChange={(value: OperationalComplexity) => updateActive({ operationalComplexity: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COMPLEXITY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div>
                            <div className="font-medium">{level.label}</div>
                            <div className="text-xs text-slate-500">{level.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {PILLARS.map((pillar) => {
              const pillarScore = getWeightedPillarScore(pillar, active.scores);
              return (
                <Card key={pillar.id} className="rounded-3xl">
                  <CardHeader>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-xl">{pillar.icon} {pillar.title}</CardTitle>
                        <CardDescription className="mt-1">{pillar.description}</CardDescription>
                        <p className="mt-2 text-xs text-slate-500">{pillar.businessImpact}</p>
                      </div>
                      <div className="min-w-[180px]">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span>Weighted Score</span>
                          <span className="font-medium">{pillarScore}%</span>
                        </div>
                        <Progress value={pillarScore} className="h-3" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {pillar.factors.map((factor) => {
                      const weightInfo = getWeightLabel(factor.weight);
                      return (
                        <div key={factor.id} className="rounded-2xl border p-4">
                          <div className="mb-3 flex items-start justify-between gap-2">
                            <Label className="text-sm font-medium">{factor.label}</Label>
                            <Badge className={`text-xs ${weightInfo.color}`}>{weightInfo.label}</Badge>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            {([1, 2, 3, 4, 5] as const).map((value) => {
                              const isActive = active.scores[factor.id] === value;
                              return (
                                <button
                                  key={value}
                                  onClick={() => updateScore(factor.id, value)}
                                  className={`rounded-2xl border px-2 py-3 text-xs transition ${isActive ? "border-slate-900 bg-slate-900 text-white" : "bg-white hover:bg-slate-50"}`}
                                >
                                  <div className="font-semibold">{value}</div>
                                  <div className="mt-1 hidden md:block">{SCALE[value]}</div>
                                </button>
                              );
                            })}
                          </div>
                          <p className="mt-3 text-xs text-slate-500">Selected: {scoreLabel(active.scores[factor.id])}</p>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* RESULTS TAB */}
          <TabsContent value="results" className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle>Pillar Score Overview</CardTitle>
                  <CardDescription>Weighted scores across readiness dimensions.</CardDescription>
                </CardHeader>
                <CardContent className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pillarData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fullName" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={80} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="score" radius={[10, 10, 0, 0]}>
                        {pillarData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.score >= 60 ? "#22c55e" : entry.score >= 40 ? "#f59e0b" : "#ef4444"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle>Readiness Shape</CardTitle>
                  <CardDescription>Visual representation of capability balance.</CardDescription>
                </CardHeader>
                <CardContent className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={pillarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="fullName" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar dataKey="score" fill="hsl(var(--primary))" fillOpacity={0.4} stroke="hsl(var(--primary))" />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Risk Dashboard */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className={`rounded-3xl border-2 ${risk.level === "high" ? "border-red-200" : risk.level === "medium" ? "border-amber-200" : "border-emerald-200"}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className={`h-5 w-5 ${risk.level === "high" ? "text-red-600" : risk.level === "medium" ? "text-amber-600" : "text-emerald-600"}`} />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={riskPieData} dataKey="value" innerRadius={25} outerRadius={40} startAngle={90} endAngle={-270} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${risk.level === "high" ? "text-red-600" : risk.level === "medium" ? "text-amber-600" : "text-emerald-600"}`}>
                        {risk.level.charAt(0).toUpperCase() + risk.level.slice(1)} Risk
                      </p>
                      <p className="text-sm text-slate-600">Score: {risk.score}/100</p>
                    </div>
                  </div>
                  {risk.factors.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-slate-700">Critical Factors:</p>
                      <ul className="mt-1 text-xs text-slate-600">
                        {risk.factors.map((f, i) => (
                          <li key={i} className="truncate">- {f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={`rounded-3xl border ${impact.color}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{impact.category}</p>
                  <p className="mt-2 text-sm text-slate-600">{impact.description}</p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    ROI Opportunity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-slate-900">{roi.range}</p>
                  <p className="text-sm text-slate-600">Efficiency improvement potential</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-slate-100 p-2">
                      <p className="text-xs text-slate-500">Low</p>
                      <p className="font-semibold">{roi.scenarios.low}</p>
                    </div>
                    <div className="rounded-lg bg-slate-200 p-2">
                      <p className="text-xs text-slate-500">Mid</p>
                      <p className="font-semibold">{roi.scenarios.mid}</p>
                    </div>
                    <div className="rounded-lg bg-slate-300 p-2">
                      <p className="text-xs text-slate-500">High</p>
                      <p className="font-semibold">{roi.scenarios.high}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">{roi.confidence} confidence</p>
                </CardContent>
              </Card>
            </div>

            {/* Top 3 Opportunities and Risks */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="rounded-3xl border-emerald-200 bg-emerald-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-800">
                    <Target className="h-5 w-5" />
                    Top 3 AI Opportunities
                  </CardTitle>
                  <CardDescription className="text-emerald-700">Highest-impact opportunities based on current readiness and sector context.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topOpportunities.map((opp, idx) => (
                    <div key={idx} className="rounded-xl border border-emerald-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-emerald-900">{opp.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{opp.description}</p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 whitespace-nowrap">{opp.impact}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-red-200 bg-red-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" />
                    Top 3 Risks if No Action Taken
                  </CardTitle>
                  <CardDescription className="text-red-700">Key risks to address if AI transformation is delayed or deprioritised.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topRisks.map((risk, idx) => (
                    <div key={idx} className="rounded-xl border border-red-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-red-900">{risk.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{risk.description}</p>
                        </div>
                        <Badge className={`whitespace-nowrap ${risk.severity === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{risk.severity}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Interpretation</CardTitle>
                <CardDescription>Executive summary for reporting or stakeholder discussion.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className={`rounded-2xl border p-4 ${band.tone}`}>
                  <p className="text-sm font-semibold">Current Maturity</p>
                  <p className="mt-2 text-2xl font-semibold">{band.label}</p>
                  <p className="mt-2 text-sm">{band.advice}</p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-sm font-semibold">Strongest Pillar</p>
                  <p className="mt-2 text-xl font-semibold">{[...pillarData].sort((a, b) => b.score - a.score)[0].fullName}</p>
                  <p className="mt-1 text-sm text-slate-600">{[...pillarData].sort((a, b) => b.score - a.score)[0].score}% weighted score</p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-sm font-semibold">Priority Development</p>
                  <p className="mt-2 text-xl font-semibold">{lowestPillars[0].fullName}</p>
                  <p className="mt-1 text-sm text-slate-600">{lowestPillars[0].score}% weighted score</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REPORT TAB - Executive Summary */}
          <TabsContent value="report" className="space-y-4">
            <Card className="rounded-3xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Client Report Summary
                    </CardTitle>
                    <CardDescription>Executive-level summary for stakeholder communication.</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => {
                    const text = generateExecutiveSummary(active);
                    navigator.clipboard.writeText(text);
                  }}>
                    <Copy className="mr-2 h-4 w-4" />Copy to Clipboard
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border bg-slate-50 p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
                    {generateExecutiveSummary(active)}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle>Key Metrics at a Glance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-slate-600">Overall Readiness</span>
                    <span className="font-semibold">{overall}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-slate-600">Maturity Band</span>
                    <Badge className={band.tone}>{band.label}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-slate-600">Risk Level</span>
                    <Badge className={risk.level === "high" ? "bg-red-100 text-red-700" : risk.level === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>
                      {risk.level.charAt(0).toUpperCase() + risk.level.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-slate-600">ROI Potential</span>
                    <span className="font-semibold">{roi.range}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-600">Sector</span>
                    <span className="font-semibold">{sectorInfo?.label}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle>Pillar Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pillarData.map((pillar) => (
                    <div key={pillar.fullName} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{pillar.fullName}</span>
                          <span className="font-medium">{pillar.score}%</span>
                        </div>
                        <Progress value={pillar.score} className="h-2" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* COMPARE TAB */}
          <TabsContent value="compare" className="space-y-4">
            <CompareView assessments={assessments} />
          </TabsContent>

          {/* RECOMMENDATIONS TAB */}
          <TabsContent value="recommendations" className="space-y-4">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Strategic Recommendations</CardTitle>
                <CardDescription>Sector-specific action items driven by assessment results. Recommendations are tailored for {sectorInfo?.label} operations.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {PILLARS.filter((pillar) => getWeightedPillarScore(pillar, active.scores) < 60).map((pillar) => (
                  <div key={pillar.id} className="rounded-2xl border p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-semibold">{pillar.icon} {pillar.title}</p>
                      <Badge variant="secondary">{getWeightedPillarScore(pillar, active.scores)}%</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{pillar.strategicRecommendations[active.sector]}</p>
                    <div className="pt-3 border-t">
                      <p className="text-xs text-slate-500">{pillar.businessImpact}</p>
                    </div>
                  </div>
                ))}
                {PILLARS.every((pillar) => getWeightedPillarScore(pillar, active.scores) >= 60) && (
                  <div className="rounded-2xl border p-4 md:col-span-2 xl:col-span-3 bg-emerald-50 border-emerald-200">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                      <Sparkles className="h-4 w-4" />
                      Strong Performance Across All Dimensions
                    </div>
                    <p className="text-sm text-emerald-700">
                      Your organisation demonstrates mature AI readiness. Focus now shifts to scaling proven use cases, 
                      establishing enterprise-wide governance frameworks, designing sustainable operating models, and 
                      implementing comprehensive benefit tracking and realisation programmes.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk-Based Priorities */}
            {risk.factors.length > 0 && (
              <Card className="rounded-3xl border-red-200 bg-red-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" />
                    Risk Mitigation Priorities
                  </CardTitle>
                  <CardDescription className="text-red-700">Critical factors requiring immediate attention to reduce operational and compliance risk.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {risk.factors.map((factor, idx) => (
                      <div key={idx} className="rounded-xl border border-red-200 bg-white p-3">
                        <p className="text-sm font-medium text-red-800">{factor}</p>
                        <p className="mt-1 text-xs text-red-600">Priority: Immediate action required</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
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
      <Card className="rounded-3xl">
        <CardContent className="p-10 text-center text-sm text-slate-600">You need at least two saved assessments to use comparison mode.</CardContent>
      </Card>
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
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Compare Assessments</CardTitle>
          <CardDescription>Benchmark two scorecards side by side using weighted scores.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Primary</Label>
            <Select value={leftId} onValueChange={setLeftId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{assessments.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Secondary</Label>
            <Select value={rightId} onValueChange={setRightId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{assessments.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{left.name}</CardTitle>
            <CardDescription>{left.businessName || "No organisation set"} {leftSector && `| ${leftSector.label}`}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold">{getWeightedOverallScore(left)}%</div>
            <p className="mt-1 text-sm text-slate-600">Risk: {getRiskScore(left).level}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{right.name}</CardTitle>
            <CardDescription>{right.businessName || "No organisation set"} {rightSector && `| ${rightSector.label}`}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold">{getWeightedOverallScore(right)}%</div>
            <p className="mt-1 text-sm text-slate-600">Risk: {getRiskScore(right).level}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Pillar Comparison</CardTitle>
        </CardHeader>
        <CardContent className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pillar" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={80} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="left" name="Primary" radius={[8, 8, 0, 0]} fill="hsl(var(--primary))" />
              <Bar dataKey="right" name="Secondary" radius={[8, 8, 0, 0]} fill="hsl(var(--muted-foreground))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}
