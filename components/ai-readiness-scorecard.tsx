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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell, PieChart, Pie, Legend } from "recharts";
import { Download, Mail, Plus, Printer, Trash2, Copy, Sparkles, AlertTriangle, TrendingUp, Shield, Building2, FileText, Zap, Target, Activity, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
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
  {
    id: "ethics",
    title: "Ethics & Governance",
    icon: "⚖️",
    description: "Responsible AI practices, regulatory compliance, transparency and fairness.",
    businessImpact: "Strong AI governance builds stakeholder trust and prevents costly regulatory penalties.",
    strategicRecommendations: {
      retail: "Focus on customer data privacy, algorithmic fairness in pricing and recommendations, and transparency in automated customer decisions. Establish clear policies for AI-driven personalisation aligned with consumer protection regulations.",
      fm: "Establish governance for AI-driven building management decisions. Ensure compliance with safety regulations and implement audit trails for automated systems and decisions affecting occupants.",
      security: "Prioritise ethical frameworks for surveillance and access control AI. Ensure bias-free threat assessment, maintain regulatory compliance across jurisdictions, and build robust audit trails.",
      logistics: "Address fairness in route optimisation and workforce scheduling algorithms. Ensure transparency in automated dispatch decisions and comply with transport and labour regulations.",
      manufacturing: "Implement safety-first governance for AI in production. Address worker privacy concerns with monitoring systems and ensure quality control AI meets industry standards and audit requirements.",
      corporate: "Establish responsible AI policies for HR and recruitment AI. Ensure transparency in performance analytics and develop clear frameworks for AI-assisted decision accountability.",
      other: "Build comprehensive AI governance frameworks with clear accountability. Establish ethics review processes and ensure regulatory compliance across all AI applications.",
    },
    factors: [
      { id: "ethics_policy", label: "AI ethics policies and frameworks", weight: 3, riskCategory: "compliance" },
      { id: "ethics_bias", label: "Bias detection and fairness monitoring", weight: 2, riskCategory: "compliance" },
      { id: "ethics_compliance", label: "Regulatory compliance readiness (EU AI Act, GDPR)", weight: 3, riskCategory: "compliance" },
      { id: "ethics_transparency", label: "Transparency and explainability practices", weight: 2, riskCategory: "compliance" },
    ],
  },
  {
    id: "culture",
    title: "Culture & Change",
    icon: "🌱",
    description: "Organisational culture, change appetite, collaboration and digital mindset.",
    businessImpact: "Cultural readiness is the strongest predictor of successful AI adoption and sustained value creation.",
    strategicRecommendations: {
      retail: "Build a data-driven culture across stores and head office. Engage frontline teams in AI pilot design and celebrate early wins visibly to drive grassroots adoption.",
      fm: "Foster collaboration between operations, IT and data teams. Address change resistance through hands-on pilot participation and visible efficiency gains for site-based staff.",
      security: "Cultivate a culture that embraces AI as augmenting human judgement, not replacing it. Build trust through transparent AI decision explanations and gradual deployment.",
      logistics: "Develop a culture of continuous improvement powered by data. Engage drivers and warehouse staff early in AI tool design to build buy-in and practical adoption.",
      manufacturing: "Bridge the gap between shop floor and digital teams. Create innovation champions at each site and build a culture where AI augments skilled workers rather than replacing them.",
      corporate: "Champion AI adoption from leadership down with clear communication of benefits. Create safe spaces for experimentation and learning from failure across knowledge work teams.",
      other: "Invest in cultural transformation alongside technology implementation. Develop change management playbooks, create AI champions, and celebrate early adoption wins systematically.",
    },
    factors: [
      { id: "culture_innovation", label: "Innovation culture and digital mindset", weight: 2, riskCategory: "operational" },
      { id: "culture_change", label: "Change management capabilities", weight: 3, riskCategory: "operational" },
      { id: "culture_collaboration", label: "Cross-functional collaboration maturity", weight: 2, riskCategory: "operational" },
      { id: "culture_leadership", label: "Leadership communication and vision alignment", weight: 2, riskCategory: "strategic" },
    ],
  },
  {
    id: "innovation",
    title: "Innovation & Experimentation",
    icon: "🚀",
    description: "Piloting capabilities, experimentation culture, learning velocity and scaling pathways.",
    businessImpact: "Experimentation capability accelerates AI time-to-value and reduces implementation risk.",
    strategicRecommendations: {
      retail: "Establish an AI innovation lab focused on customer experience and store operations. Run structured pilots with clear success criteria and measurement frameworks for scaling decisions.",
      fm: "Create a testing environment for predictive maintenance and energy optimisation AI. Implement structured pilot frameworks with clear ROI tracking and scaling criteria.",
      security: "Develop controlled testing environments for threat detection AI. Establish red-team/blue-team AI testing protocols and iterate based on false positive/negative analysis.",
      logistics: "Build sandbox environments for route optimisation and demand prediction testing. Run A/B tests on AI-driven scheduling and measure impact on delivery performance.",
      manufacturing: "Establish digital twin capabilities for safe AI experimentation. Run production line pilots with clear quality and efficiency metrics, plus defined scaling pathways.",
      corporate: "Create internal AI innovation challenges and hackathons. Establish pilot frameworks for document AI and workflow automation with clear success criteria and adoption metrics.",
      other: "Build systematic experimentation capabilities with clear pilot-to-production pathways. Establish innovation metrics, learning loops, and scaling decision frameworks.",
    },
    factors: [
      { id: "innovation_pilot", label: "Proof of concept and pilot capabilities", weight: 2, riskCategory: "strategic" },
      { id: "innovation_proto", label: "Rapid prototyping infrastructure", weight: 2, riskCategory: "operational" },
      { id: "innovation_learning", label: "Learning loops and iteration processes", weight: 2, riskCategory: "operational" },
      { id: "innovation_metrics", label: "Innovation metrics and success tracking", weight: 3, riskCategory: "strategic" },
    ],
  },
];

// Industry benchmark scores by sector (average maturity by pillar)
const INDUSTRY_BENCHMARKS: Record<Sector, Record<string, number>> = {
  retail:        { strategy: 48, people: 42, process: 52, data: 45, tech: 50, ethics: 38, culture: 44, innovation: 40 },
  fm:            { strategy: 40, people: 36, process: 48, data: 40, tech: 44, ethics: 34, culture: 38, innovation: 32 },
  security:      { strategy: 52, people: 44, process: 50, data: 48, tech: 55, ethics: 50, culture: 40, innovation: 38 },
  logistics:     { strategy: 45, people: 40, process: 55, data: 44, tech: 48, ethics: 36, culture: 42, innovation: 36 },
  manufacturing: { strategy: 50, people: 38, process: 58, data: 46, tech: 52, ethics: 40, culture: 36, innovation: 42 },
  corporate:     { strategy: 55, people: 50, process: 45, data: 48, tech: 50, ethics: 48, culture: 52, innovation: 44 },
  other:         { strategy: 45, people: 40, process: 48, data: 42, tech: 46, ethics: 38, culture: 42, innovation: 36 },
};

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

// ─── ROADMAP GENERATION ──────────────────────────────────────────────────────
type RoadmapPriority = "Critical" | "Important" | "Strategic" | "Standard";
type RoadmapItem = { pillar: string; pillarIcon: string; action: string; priority: RoadmapPriority; score: number };
type RoadmapPhase = {
  phase: string;
  timeline: string;
  focus: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  items: RoadmapItem[];
};

function generateRoadmap(assessment: Assessment): RoadmapPhase[] {
  const pillarScores = PILLARS.map((p) => ({
    pillar: p,
    score: getWeightedPillarScore(p, assessment.scores),
  }));

  const critical = pillarScores.filter((p) => p.score < 40).sort((a, b) => a.score - b.score);
  const developing = pillarScores.filter((p) => p.score >= 40 && p.score < 65).sort((a, b) => a.score - b.score);
  const strong = pillarScores.filter((p) => p.score >= 65).sort((a, b) => b.score - a.score);

  const buildItems = (list: typeof pillarScores, priority: RoadmapPriority): RoadmapItem[] =>
    list.map(({ pillar, score }) => ({
      pillar: pillar.title,
      pillarIcon: pillar.icon,
      action: pillar.strategicRecommendations[assessment.sector].split(". ")[0] + ".",
      priority,
      score,
    }));

  return [
    {
      phase: "Phase 1 — Foundation",
      timeline: "0–90 Days",
      focus: "Address critical gaps & establish baseline",
      description: "Stabilise high-risk areas and build the foundations needed before any AI initiative can succeed.",
      color: "#f43f5e",
      bgColor: "#fff1f2",
      borderColor: "#fecdd3",
      items: critical.length > 0
        ? buildItems(critical, "Critical")
        : [{ pillar: "Quick Wins", pillarIcon: "⚡", action: "Identify 2-3 lower-risk AI use cases that can deliver value within 60 days while broader capability building continues.", priority: "Standard", score: 70 }],
    },
    {
      phase: "Phase 2 — Build",
      timeline: "3–6 Months",
      focus: "Develop capabilities & run targeted pilots",
      description: "Move beyond foundations: build skills, launch focused pilots, and create the operating model for sustainable AI delivery.",
      color: "#f59e0b",
      bgColor: "#fffbeb",
      borderColor: "#fde68a",
      items: developing.length > 0
        ? buildItems(developing, "Important")
        : [{ pillar: "Pilot Acceleration", pillarIcon: "🧪", action: "Scale successful pilots to wider business units and deepen cross-functional integration of AI tools.", priority: "Important", score: 60 }],
    },
    {
      phase: "Phase 3 — Scale",
      timeline: "6–12 Months",
      focus: "Scale proven solutions & measure impact",
      description: "Translate proven pilots into enterprise-wide deployment with clear governance, KPIs and continuous improvement loops.",
      color: "#10b981",
      bgColor: "#ecfdf5",
      borderColor: "#a7f3d0",
      items: strong.length > 0
        ? buildItems(strong.slice(0, 4), "Strategic")
        : [{ pillar: "Enterprise Scaling", pillarIcon: "🏛️", action: "Establish enterprise AI governance, value tracking, and a continuous improvement framework across all business units.", priority: "Strategic", score: 75 }],
    },
  ];
}

function exportPdf(assessment: Assessment) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const MARGIN = 16;
  const CONTENT_W = W - MARGIN * 2;
  const overall = getWeightedOverallScore(assessment);
  const band = getBand(overall);
  const risk = getRiskScore(assessment);
  const impact = getBusinessImpact(assessment);
  const roi = getROIOpportunity(assessment);
  const sector = SECTORS.find((s) => s.value === assessment.sector);
  const topOpps = getTopOpportunities(assessment);
  const topRisks = getTopRisks(assessment);
  const pillarScores = PILLARS.map((p) => ({ title: p.title, score: getWeightedPillarScore(p, assessment.scores), rec: p.strategicRecommendations[assessment.sector], impact: p.businessImpact }));
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const addPageFooter = (pageNum: number) => {
    doc.setFillColor(30, 27, 75);
    doc.rect(0, 285, W, 12, "F");
    doc.setTextColor(165, 180, 252);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("AI Transformation Readiness Report — Confidential", MARGIN, 292);
    doc.text(`Page ${pageNum}`, W - MARGIN, 292, { align: "right" });
  };

  const scoreColor = (s: number): [number, number, number] =>
    s >= 70 ? [5, 150, 105] : s >= 50 ? [8, 145, 178] : s >= 30 ? [217, 119, 6] : [239, 68, 68];

  // ─── PAGE 1: COVER ───────────────────────────────────────────────────────────
  doc.setFillColor(30, 27, 75); // deep indigo
  doc.rect(0, 0, W, 297, "F");

  // Accent bar - indigo gradient effect (solid color simulation)
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, 6, 297, "F");

  // Logo / brand strip
  doc.setTextColor(165, 180, 252);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("AI READINESS · 8-DIMENSION ENTERPRISE FRAMEWORK", MARGIN + 6, 22);

  // Main title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text("AI Transformation", MARGIN + 6, 80);
  doc.text("Readiness Report", MARGIN + 6, 94);

  // Divider
  doc.setFillColor(99, 102, 241);
  doc.rect(MARGIN + 6, 100, 80, 1.5, "F");

  // Org name
  doc.setFontSize(16);
  doc.setTextColor(226, 232, 240);
  doc.text(assessment.businessName || "Organisation Not Specified", MARGIN + 6, 114);

  // Meta grid
  const meta = [
    ["Sector", sector?.label || "General"],
    ["Assessor", assessment.assessor || "Not specified"],
    ["Assessment", assessment.name],
    ["Date", dateStr],
  ];
  let metaY = 134;
  meta.forEach(([label, value]) => {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase(), MARGIN + 6, metaY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text(value, MARGIN + 6, metaY + 5);
    metaY += 14;
  });

  // Score circle (drawn as text block)
  const [sr, sg, sb] = scoreColor(overall);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(sr, sg, sb);
  doc.setLineWidth(3);
  doc.circle(W - 50, 120, 30, "D");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(`${overall}%`, W - 50, 117, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(sr, sg, sb);
  doc.text("READINESS", W - 50, 124, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text(band.label, W - 50, 132, { align: "center" });

  // Bottom strip
  doc.setFillColor(20, 184, 166, 0.15);
  doc.setFillColor(49, 46, 129);
  doc.rect(0, 265, W, 32, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("This report is confidential and intended solely for the named organisation. Scores are based on responses provided during the assessment.", MARGIN + 6, 275, { maxWidth: CONTENT_W - 6 });

  addPageFooter(1);

  // ─── PAGE 2: EXECUTIVE SUMMARY ───────────────────────────────────────────────
  doc.addPage();

  const sectionHeader = (title: string, y: number): number => {
    doc.setFillColor(30, 27, 75);
    doc.rect(0, y - 6, W, 14, "F");
    doc.setFillColor(99, 102, 241);
    doc.rect(0, y - 6, 4, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, MARGIN, y + 3);
    return y + 16;
  };

  let y = 18;
  y = sectionHeader("EXECUTIVE SUMMARY", y);

  // Score overview boxes (4-up)
  const kpis = [
    { label: "AI Readiness Score", value: `${overall}%`, sub: band.label, c: scoreColor(overall) },
    { label: "Risk Level", value: risk.level.charAt(0).toUpperCase() + risk.level.slice(1), sub: `Score: ${risk.score}/100`, c: risk.level === "high" ? [239, 68, 68] as [number,number,number] : risk.level === "medium" ? [217, 119, 6] as [number,number,number] : [5, 150, 105] as [number,number,number] },
    { label: "Business Impact", value: impact.category.split(" ")[0], sub: impact.category, c: [8, 145, 178] as [number,number,number] },
    { label: "ROI Opportunity", value: roi.range.split("–")[0].trim(), sub: `${roi.confidence} confidence`, c: [13, 148, 136] as [number,number,number] },
  ];
  const boxW = (CONTENT_W - 9) / 4;
  kpis.forEach((kpi, i) => {
    const bx = MARGIN + i * (boxW + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, y, boxW, 22, 2, 2, "FD");
    doc.setFillColor(...kpi.c);
    doc.rect(bx, y, boxW, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...kpi.c);
    doc.text(kpi.value, bx + boxW / 2, y + 11, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, bx + boxW / 2, y + 6, { align: "center" });
    doc.text(kpi.sub, bx + boxW / 2, y + 17, { align: "center" });
  });
  y += 28;

  // Summary narrative
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  const narrative = doc.splitTextToSize(generateExecutiveSummary(assessment).slice(0, 700), CONTENT_W);
  doc.text(narrative, MARGIN, y);
  y += narrative.length * 4.5 + 6;

  // ─── PILLAR SCORES ───────────────────────────────────────────────────────────
  y = sectionHeader("PILLAR SCORES (WEIGHTED)", y);

  pillarScores.forEach((pillar) => {
    if (y > 255) { doc.addPage(); addPageFooter(doc.getNumberOfPages()); y = 18; }
    const [pr, pg, pb] = scoreColor(pillar.score);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(pillar.title, MARGIN, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(pr, pg, pb);
    doc.text(`${pillar.score}%`, W - MARGIN, y + 4, { align: "right" });

    // Bar track
    const barX = MARGIN;
    const barW = CONTENT_W - 14;
    const barH = 4;
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(barX, y + 6, barW, barH, 1, 1, "F");
    doc.setFillColor(pr, pg, pb);
    const filled = Math.max(2, (pillar.score / 100) * barW);
    doc.roundedRect(barX, y + 6, filled, barH, 1, 1, "F");

    // Impact line
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text(pillar.impact, MARGIN, y + 14);
    y += 18;
  });

  addPageFooter(2);

  // ─── PAGE 3: BUSINESS PROFILE + OPPORTUNITIES + RISKS ────────────────────────
  doc.addPage();
  y = 18;
  y = sectionHeader("BUSINESS PROFILE", y);

  const profile = [
    ["Organisation", assessment.businessName || "Not specified"],
    ["Sector", sector?.label || "General"],
    ["Company Size", COMPANY_SIZES.find(s => s.value === assessment.companySize)?.label || "Not specified"],
    ["Sites", assessment.numberOfSites || "Not specified"],
    ["Annual Revenue", assessment.annualRevenue || "Not specified"],
    ["Operational Complexity", COMPLEXITY_LEVELS.find(c => c.value === assessment.operationalComplexity)?.label || "Not specified"],
  ];
  const colW = (CONTENT_W - 4) / 2;
  profile.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const px = MARGIN + col * (colW + 4);
    const py = y + row * 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), px, py);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(value, px, py + 5);
  });
  y += Math.ceil(profile.length / 2) * 12 + 6;

  if (assessment.notes.trim()) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    const noteLines = doc.splitTextToSize(assessment.notes, CONTENT_W - 8);
    doc.roundedRect(MARGIN, y, CONTENT_W, noteLines.length * 4.5 + 10, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("ASSESSOR NOTES", MARGIN + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(noteLines, MARGIN + 4, y + 12);
    y += noteLines.length * 4.5 + 16;
  }

  // Opportunities
  y = sectionHeader("TOP AI OPPORTUNITIES", y);
  topOpps.forEach((opp, i) => {
    if (y > 255) { doc.addPage(); addPageFooter(doc.getNumberOfPages()); y = 18; }
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(153, 246, 228);
    doc.setLineWidth(0.3);
    const oppLines = doc.splitTextToSize(opp.description, CONTENT_W - 55);
    doc.roundedRect(MARGIN, y, CONTENT_W, oppLines.length * 4.5 + 14, 2, 2, "FD");
    doc.setFillColor(5, 150, 105);
    doc.roundedRect(MARGIN, y, 4, oppLines.length * 4.5 + 14, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(6, 95, 70);
    doc.text(`${i + 1}. ${opp.title}`, MARGIN + 8, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(15, 79, 58);
    doc.text(oppLines, MARGIN + 8, y + 13);
    doc.setFillColor(209, 250, 229);
    doc.roundedRect(W - MARGIN - 28, y + 4, 26, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(6, 95, 70);
    doc.text(opp.impact, W - MARGIN - 15, y + 9.5, { align: "center" });
    y += oppLines.length * 4.5 + 18;
  });

  // Risks
  y = sectionHeader("KEY RISKS IF NO ACTION TAKEN", y);
  topRisks.forEach((r, i) => {
    if (y > 255) { doc.addPage(); addPageFooter(doc.getNumberOfPages()); y = 18; }
    const isHigh = r.severity === "High";
    doc.setFillColor(isHigh ? 255 : 255, isHigh ? 241 : 251, isHigh ? 242 : 235);
    doc.setDrawColor(isHigh ? 254 : 253, isHigh ? 205 : 211, isHigh ? 211 : 153);
    doc.setLineWidth(0.3);
    const rLines = doc.splitTextToSize(r.description, CONTENT_W - 55);
    doc.roundedRect(MARGIN, y, CONTENT_W, rLines.length * 4.5 + 14, 2, 2, "FD");
    doc.setFillColor(isHigh ? 239 : 217, isHigh ? 68 : 119, isHigh ? 68 : 6);
    doc.roundedRect(MARGIN, y, 4, rLines.length * 4.5 + 14, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(isHigh ? 153 : 146, isHigh ? 27 : 64, isHigh ? 27 : 10);
    doc.text(`${i + 1}. ${r.title}`, MARGIN + 8, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(rLines, MARGIN + 8, y + 13);
    doc.setFillColor(isHigh ? 254 : 254, isHigh ? 226 : 243, isHigh ? 226 : 199);
    doc.roundedRect(W - MARGIN - 28, y + 4, 26, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(r.severity, W - MARGIN - 15, y + 9.5, { align: "center" });
    y += rLines.length * 4.5 + 18;
  });

  addPageFooter(3);

  // ─── PAGE 4: STRATEGIC RECOMMENDATIONS ───────────────────────────────────────
  doc.addPage();
  y = 18;
  y = sectionHeader("STRATEGIC RECOMMENDATIONS BY PILLAR", y);

  const actionPillars = pillarScores.filter(p => p.score < 70);
  actionPillars.forEach((pillar, idx) => {
    if (y > 248) { doc.addPage(); addPageFooter(doc.getNumberOfPages()); y = 18; }
    const [pr, pg, pb] = scoreColor(pillar.score);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    const recLines = doc.splitTextToSize(pillar.rec, CONTENT_W - 14);
    const boxH = recLines.length * 4.5 + 22;
    doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 2, 2, "FD");
    doc.setFillColor(pr, pg, pb);
    doc.rect(MARGIN, y, CONTENT_W, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(pillar.title, MARGIN + 5, y + 9);

    doc.setFillColor(pr, pg, pb);
    doc.roundedRect(W - MARGIN - 25, y + 3, 23, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`${pillar.score}%`, W - MARGIN - 13.5, y + 8.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(recLines, MARGIN + 5, y + 16);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(pillar.impact, MARGIN + 5, y + boxH - 5);
    y += boxH + 5;
  });

  if (actionPillars.length === 0) {
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(153, 246, 228);
    doc.roundedRect(MARGIN, y, CONTENT_W, 20, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(6, 95, 70);
    doc.text("Strong performance across all dimensions — ready to scale AI adoption.", MARGIN + 5, y + 12);
    y += 26;
  }

  // ROI Scenarios
  y = sectionHeader("ROI SCENARIOS", y);
  const roiScenarios = [
    { label: "Conservative", value: roi.scenarios.low, desc: "Baseline efficiency gains with minimal change management", color: [100, 116, 139] as [number,number,number] },
    { label: "Moderate", value: roi.scenarios.mid, desc: "Structured implementation with cross-functional adoption", color: [8, 145, 178] as [number,number,number] },
    { label: "Optimistic", value: roi.scenarios.high, desc: "Full capability build with strategic AI-first transformation", color: [13, 148, 136] as [number,number,number] },
  ];
  const roiW = (CONTENT_W - 8) / 3;
  roiScenarios.forEach((s, i) => {
    const rx = MARGIN + i * (roiW + 4);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(rx, y, roiW, 30, 2, 2, "FD");
    doc.setFillColor(...s.color);
    doc.rect(rx, y, roiW, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...s.color);
    doc.text(s.label.toUpperCase(), rx + roiW / 2, y + 8, { align: "center" });
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(s.value, rx + roiW / 2, y + 18, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    const descLines = doc.splitTextToSize(s.desc, roiW - 4);
    doc.text(descLines, rx + roiW / 2, y + 24, { align: "center" });
  });

  addPageFooter(4);

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

const PILLAR_COLORS = [
  { from: "#6366f1", to: "#4f46e5" },  // indigo - Strategy & Leadership
  { from: "#3b82f6", to: "#2563eb" },  // blue - People & Capability
  { from: "#06b6d4", to: "#0891b2" },  // cyan - Process & Operations
  { from: "#14b8a6", to: "#0d9488" },  // teal - Data & Insight
  { from: "#10b981", to: "#059669" },  // emerald - Technology & Integration
  { from: "#8b5cf6", to: "#7c3aed" },  // violet - Ethics & Governance
  { from: "#f43f5e", to: "#e11d48" },  // rose - Culture & Change
  { from: "#f59e0b", to: "#d97706" },  // amber - Innovation & Experimentation
];

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
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={strokeWidth} />
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${circumference - filled}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber value={score} suffix="%" className="text-3xl font-black text-white leading-none" />
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
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      const seenWelcome = localStorage.getItem("ai-readiness-welcome-seen-v1");
      if (!seenWelcome) setShowWelcome(true);
    }
  }, [mounted]);

  const dismissWelcome = () => {
    setShowWelcome(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("ai-readiness-welcome-seen-v1", "true");
    }
  };

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
    <div className="min-h-screen bg-slate-100">
      {/* WELCOME OVERLAY */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(8px)" }}>
          <div className="relative max-w-2xl w-full rounded-3xl overflow-hidden animate-scale-in shadow-2xl" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #134e4a 100%)" }}>
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, #818cf8, transparent)" }}></div>
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, #14b8a6, transparent)" }}></div>
            <div className="relative p-8 md:p-12">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-wide text-indigo-200 mb-5" style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(129,140,248,0.4)" }}>
                <Sparkles className="h-3 w-3" /> WELCOME
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                Assess your <span style={{ background: "linear-gradient(90deg, #818cf8, #5eead4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI readiness</span> like a Fortune 500 leader
              </h2>
              <p className="mt-4 text-indigo-100/80 text-base leading-relaxed">
                A professional 8-dimension framework with weighted scoring, sector-specific benchmarks, and an actionable 12-month roadmap — all in one beautifully designed tool.
              </p>
              <div className="mt-7 grid gap-3 md:grid-cols-2">
                {[
                  { icon: <Target className="h-4 w-4" />, title: "8 Dimensions", desc: "Strategy, People, Process, Data, Tech, Ethics, Culture, Innovation" },
                  { icon: <Activity className="h-4 w-4" />, title: "Industry Benchmarks", desc: "Compare against sector averages from real organisations" },
                  { icon: <TrendingUp className="h-4 w-4" />, title: "Phased Roadmap", desc: "0–90 day foundations through 12-month enterprise scaling" },
                  { icon: <FileText className="h-4 w-4" />, title: "Executive PDF", desc: "Beautifully designed, board-ready report in one click" },
                ].map((item) => (
                  <div key={item.title} className="glass rounded-xl p-3.5 flex items-start gap-3">
                    <div className="rounded-lg p-2 flex-shrink-0" style={{ background: "rgba(99,102,241,0.25)", color: "#a5b4fc" }}>{item.icon}</div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.title}</p>
                      <p className="text-xs text-indigo-200/70 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={dismissWelcome}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, #6366f1, #14b8a6)" }}
                >
                  Start My Assessment <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={dismissWelcome}
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-indigo-100 transition hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HERO HEADER */}
      <div className="aurora-bg" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #1e3a5f 65%, #0f3d3e 100%)" }}>
        <div className="relative mx-auto max-w-7xl px-4 pt-6 pb-0 md:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide text-indigo-200 animate-fade-in" style={{ background: "rgba(99,102,241,0.18)", border: "1px solid rgba(129,140,248,0.4)" }}>
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
                <span style={{ background: "linear-gradient(90deg, #818cf8, #a78bfa, #5eead4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundSize: "200% 200%" }} className="animate-gradient">
                  AI Transformation Readiness
                </span>
              </h1>
              <p className="mt-2 text-sm text-indigo-200/70">8 Dimensions · Industry Benchmarks · Phased Roadmap · Sector-specific Insight</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={createNew} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-90 hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #6366f1, #14b8a6)" }}>
                  <Plus className="h-4 w-4" /> New Assessment
                </button>
                <button onClick={() => exportPdf(active)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-80" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Download className="h-4 w-4" /> PDF
                </button>
                <button onClick={() => mailTo(active)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-80" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Mail className="h-4 w-4" /> Email
                </button>
                <button onClick={duplicate} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-80" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Copy className="h-4 w-4" /> Duplicate
                </button>
              </div>
            </div>
            <div className="flex items-center gap-5 flex-shrink-0">
              <ScoreRing score={overall} size={148} />
              <div className="hidden md:flex flex-col gap-2">
                <div className={`rounded-xl px-4 py-2.5 text-center border ${band.tone}`}>
                  <p className="text-base font-black">{band.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">Maturity Band</p>
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
        <div className="mt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="mx-auto max-w-7xl px-4 py-4 md:px-8">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 stagger-children">
              {[
                { label: "AI Maturity", numeric: overall, sub: band.label, icon: <TrendingUp className="h-3.5 w-3.5" />, color: "#a5b4fc" },
                { label: "Operational Impact", numeric: operationalImpact, sub: "Process & tech", icon: <Activity className="h-3.5 w-3.5" />, color: "#5eead4" },
                { label: "Efficiency Opportunity", numeric: efficiencyOpportunity, sub: "Improvement gap", icon: <Zap className="h-3.5 w-3.5" />, color: "#c4b5fd" },
                { label: "Risk Exposure", numeric: riskExposure, sub: `${risk.level.charAt(0).toUpperCase() + risk.level.slice(1)} risk`, icon: <AlertTriangle className="h-3.5 w-3.5" />, color: riskExposure >= 60 ? "#fda4af" : riskExposure >= 30 ? "#fcd34d" : "#86efac" },
              ].map((kpi) => (
                <div key={kpi.label} className="glass-strong rounded-2xl p-3 hover-lift">
                  <div className="flex items-center gap-1.5 text-xs font-semibold mb-1.5" style={{ color: kpi.color }}>
                    {kpi.icon} {kpi.label}
                  </div>
                  <AnimatedNumber value={kpi.numeric} suffix="%" className="text-2xl font-black text-white" />
                  <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>
                </div>
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
                    <div key={item.id} className="rounded-xl p-3 transition cursor-pointer hover-lift" style={{ border: isActive ? "1px solid #6366f1" : "1px solid #f1f5f9", background: isActive ? "linear-gradient(135deg, #eef2ff, #f5f3ff)" : "white" }}>
                      <button className="w-full text-left" onClick={() => setActiveId(item.id)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold" style={{ color: isActive ? "#3730a3" : "#0f172a" }}>{item.name}</p>
                            <p className="truncate text-xs text-slate-400 mt-0.5">{item.businessName || "No organisation set"}</p>
                            {itemSector && <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full" style={{ background: isActive ? "#c7d2fe" : "#f1f5f9", color: isActive ? "#3730a3" : "#64748b" }}>{itemSector.label}</span>}
                          </div>
                          <span className="text-xs font-black rounded-full px-2.5 py-1 flex-shrink-0" style={{ background: itemOverall >= 70 ? "#d1fae5" : itemOverall >= 50 ? "#e0e7ff" : itemOverall >= 30 ? "#fef3c7" : "#ffe4e6", color: itemOverall >= 70 ? "#065f46" : itemOverall >= 50 ? "#3730a3" : itemOverall >= 30 ? "#92400e" : "#9f1239" }}>
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
            <div className="rounded-2xl overflow-hidden hover-lift" style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81 65%, #134e4a)", border: "1px solid #312e81" }}>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-indigo-300" />
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">8-Dimension Framework</p>
                </div>
                <p className="text-[11px] text-indigo-100/70 leading-relaxed mb-3">Aligned with Microsoft, AIMRI and EU AI Act readiness standards.</p>
                <div className="space-y-1">
                  {PILLARS.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ background: `linear-gradient(180deg, ${PILLAR_COLORS[i].from}, ${PILLAR_COLORS[i].to})` }} />
                      <span className="text-xs text-indigo-100/90 font-medium leading-tight">{p.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick stats card */}
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden hover-lift" style={{ border: "1px solid #e2e8f0" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                  Active Assessment
                </p>
              </div>
              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Maturity</span>
                  <span className="font-bold" style={{ color: overall >= 70 ? "#10b981" : overall >= 50 ? "#6366f1" : overall >= 30 ? "#f59e0b" : "#f43f5e" }}>{band.label}</span>
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
              <TabsList className="grid w-full grid-cols-6 rounded-2xl bg-white shadow-sm p-1 h-auto" style={{ border: "1px solid #e2e8f0" }}>
                {[
                  { value: "assess", label: "Assess", icon: <Target className="h-3.5 w-3.5" /> },
                  { value: "results", label: "Results", icon: <Activity className="h-3.5 w-3.5" /> },
                  { value: "roadmap", label: "Roadmap", icon: <TrendingUp className="h-3.5 w-3.5" /> },
                  { value: "report", label: "Report", icon: <FileText className="h-3.5 w-3.5" /> },
                  { value: "compare", label: "Compare", icon: <Building2 className="h-3.5 w-3.5" /> },
                  { value: "recommendations", label: "Actions", icon: <Sparkles className="h-3.5 w-3.5" /> },
                ].map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold py-2.5 transition data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600" style={{ ["--tw-ring-color" as string]: "transparent" }}>
                    {t.icon}
                    <span className="hidden sm:inline">{t.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ─── ASSESS TAB ─── */}
              <TabsContent value="assess" className="space-y-5">
                {/* Assessment Details */}
                <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                  <div className="px-6 py-4" style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <h2 className="text-base font-bold text-white">Assessment Details</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Set context before completing the pillar questions.</p>
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
                  <div className="px-6 py-4" style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <h2 className="text-base font-bold text-white">Business Profile</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Organisation context that influences readiness interpretation.</p>
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

                {/* Pillar cards */}
                {PILLARS.map((pillar, pillarIdx) => {
                  const pillarScore = getWeightedPillarScore(pillar, active.scores);
                  const color = PILLAR_COLORS[pillarIdx];
                  return (
                    <div key={pillar.id} className="rounded-2xl bg-white shadow-sm overflow-hidden hover-lift animate-fade-in" style={{ border: "1px solid #e2e8f0", borderLeft: `4px solid ${color.from}` }}>
                      <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md" style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}>
                            {pillar.icon}
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900">{pillar.title}</h3>
                            <p className="text-sm text-slate-500 mt-0.5">{pillar.description}</p>
                            <p className="text-xs text-slate-400 mt-1 italic">{pillar.businessImpact}</p>
                          </div>
                        </div>
                        <div className="min-w-[220px]">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Weighted Score</span>
                            <span className="text-sm font-black" style={{ color: color.from }}>{pillarScore}%</span>
                          </div>
                          <div className="relative h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full progress-fill" style={{ width: `${pillarScore}%`, background: `linear-gradient(90deg, ${color.from}, ${color.to})` }} />
                            {/* Benchmark marker */}
                            <div className="absolute top-0 h-full w-0.5 bg-slate-700/60" style={{ left: `${INDUSTRY_BENCHMARKS[active.sector]?.[pillar.id] ?? 45}%` }} title={`Industry benchmark: ${INDUSTRY_BENCHMARKS[active.sector]?.[pillar.id] ?? 45}%`} />
                          </div>
                          <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                            <span>vs. {sectorInfo?.label} avg <span className="font-bold text-slate-600">{INDUSTRY_BENCHMARKS[active.sector]?.[pillar.id] ?? 45}%</span></span>
                            <span className={`font-bold ${pillarScore > (INDUSTRY_BENCHMARKS[active.sector]?.[pillar.id] ?? 45) ? "text-emerald-600" : "text-amber-600"}`}>
                              {pillarScore > (INDUSTRY_BENCHMARKS[active.sector]?.[pillar.id] ?? 45) ? "↑ Above" : "↓ Below"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 px-6 pb-6 md:grid-cols-2">
                        {pillar.factors.map((factor) => {
                          const weightInfo = getWeightLabel(factor.weight);
                          const currentScore = active.scores[factor.id];
                          const btnBg = ["", "#f43f5e", "#f97316", "#eab308", "#14b8a6", "#10b981"];
                          return (
                            <div key={factor.id} className="rounded-xl p-4" style={{ border: "1px solid #f1f5f9", background: "#f8fafc" }}>
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
                                      <div className="mt-1 text-[10px] hidden md:block leading-tight opacity-80">{SCALE[value].split(" ")[0]}</div>
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
              </TabsContent>

              {/* ─── RESULTS TAB ─── */}
              <TabsContent value="results" className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                    <div className="px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <h3 className="font-black text-slate-900">Pillar Score Overview</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Weighted scores across readiness dimensions</p>
                    </div>
                    <div className="p-4 h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pillarData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="fullName" tick={{ fontSize: 10, fill: "#64748b" }} interval={0} angle={-25} textAnchor="end" height={90} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }} />
                          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                          <Bar dataKey="score" name="Your Score" radius={[8, 8, 0, 0]}>
                            {pillarData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PILLAR_COLORS[index]?.from || "#6366f1"} />
                            ))}
                          </Bar>
                          <Bar dataKey="benchmark" name="Industry Avg" radius={[8, 8, 0, 0]} fill="#94a3b8" fillOpacity={0.5} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                    <div className="px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <h3 className="font-black text-slate-900">Readiness Shape</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Visual capability balance across all dimensions</p>
                    </div>
                    <div className="p-4 h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={pillarData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="fullName" tick={{ fontSize: 11, fill: "#64748b" }} />
                          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                          <Radar name="Your Score" dataKey="score" fill="#6366f1" fillOpacity={0.25} stroke="#6366f1" strokeWidth={2.5} />
                          <Radar name="Industry Benchmark" dataKey="benchmark" fill="#14b8a6" fillOpacity={0.1} stroke="#14b8a6" strokeWidth={2} strokeDasharray="4 4" />
                          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className={`rounded-2xl p-5 ${risk.level === "high" ? "bg-red-50 border-2 border-red-200" : risk.level === "medium" ? "bg-amber-50 border-2 border-amber-200" : "bg-emerald-50 border-2 border-emerald-200"}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className={`h-5 w-5 ${risk.level === "high" ? "text-red-600" : risk.level === "medium" ? "text-amber-600" : "text-emerald-600"}`} />
                      <span className="font-black text-slate-800">Risk Assessment</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-24 w-24">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart><Pie data={riskPieData} dataKey="value" innerRadius={25} outerRadius={40} startAngle={90} endAngle={-270} /></PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p className={`text-2xl font-black ${risk.level === "high" ? "text-red-700" : risk.level === "medium" ? "text-amber-700" : "text-emerald-700"}`}>
                          {risk.level.charAt(0).toUpperCase() + risk.level.slice(1)}
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5">Score: {risk.score}/100</p>
                      </div>
                    </div>
                    {risk.factors.length > 0 && (
                      <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                        <p className="text-xs font-bold text-slate-700 mb-1.5">Critical Factors:</p>
                        <ul className="space-y-1">{risk.factors.map((f, i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-1"><span className="text-red-400 mt-0.5 flex-shrink-0">•</span>{f}</li>)}</ul>
                      </div>
                    )}
                  </div>

                  <div className={`rounded-2xl p-5 border-2 ${impact.color}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-5 w-5" />
                      <span className="font-black">Business Impact</span>
                    </div>
                    <p className="text-xl font-black leading-tight">{impact.category}</p>
                    <p className="mt-2 text-sm leading-relaxed opacity-80">{impact.description}</p>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid #e2e8f0" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-5 w-5 text-sky-600" />
                      <span className="font-black text-slate-800">ROI Opportunity</span>
                    </div>
                    <p className="text-4xl font-black" style={{ background: "linear-gradient(135deg, #0891b2, #0d9488)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{roi.range}</p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">Efficiency improvement potential</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl p-2" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <p className="text-xs text-slate-400">Low</p>
                        <p className="text-sm font-black text-slate-700">{roi.scenarios.low}</p>
                      </div>
                      <div className="rounded-xl p-2" style={{ background: "#e0f2fe", border: "1px solid #bae6fd" }}>
                        <p className="text-xs text-sky-500">Mid</p>
                        <p className="text-sm font-black text-sky-700">{roi.scenarios.mid}</p>
                      </div>
                      <div className="rounded-xl p-2" style={{ background: "#f0fdfa", border: "1px solid #99f6e4" }}>
                        <p className="text-xs text-teal-500">High</p>
                        <p className="text-sm font-black text-teal-700">{roi.scenarios.high}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{roi.confidence} confidence</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl overflow-hidden" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <div className="px-5 py-4" style={{ borderBottom: "1px solid #bbf7d0" }}>
                      <div className="flex items-center gap-2"><Target className="h-4 w-4 text-emerald-700" /><h3 className="font-black text-emerald-900">Top 3 AI Opportunities</h3></div>
                      <p className="text-xs text-emerald-600 mt-0.5">Highest-impact opportunities for {sectorInfo?.label}</p>
                    </div>
                    <div className="p-4 space-y-3">
                      {topOpportunities.map((opp, idx) => (
                        <div key={idx} className="rounded-xl bg-white p-4" style={{ border: "1px solid #bbf7d0" }}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{opp.title}</p>
                              <p className="text-xs text-slate-500 mt-1">{opp.description}</p>
                            </div>
                            <span className="flex-shrink-0 text-xs px-2 py-1 rounded-full font-bold" style={{ background: "#d1fae5", color: "#065f46" }}>{opp.impact}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl overflow-hidden" style={{ background: "#fff1f2", border: "1px solid #fecdd3" }}>
                    <div className="px-5 py-4" style={{ borderBottom: "1px solid #fecdd3" }}>
                      <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-700" /><h3 className="font-black text-red-900">Top 3 Risks if No Action</h3></div>
                      <p className="text-xs text-red-600 mt-0.5">Consequences of delaying AI transformation</p>
                    </div>
                    <div className="p-4 space-y-3">
                      {topRisks.map((r, idx) => (
                        <div key={idx} className="rounded-xl bg-white p-4" style={{ border: "1px solid #fecdd3" }}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{r.title}</p>
                              <p className="text-xs text-slate-500 mt-1">{r.description}</p>
                            </div>
                            <span className="flex-shrink-0 text-xs px-2 py-1 rounded-full font-bold" style={{ background: r.severity === "High" ? "#fee2e2" : "#fef3c7", color: r.severity === "High" ? "#991b1b" : "#92400e" }}>{r.severity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                  <div className="px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <h3 className="font-black text-slate-900">Interpretation</h3>
                  </div>
                  <div className="p-5 grid gap-3 md:grid-cols-3">
                    <div className={`rounded-2xl border-2 p-5 ${band.tone}`}>
                      <p className="text-xs font-bold uppercase tracking-wider opacity-60">Current Maturity</p>
                      <p className="mt-2 text-3xl font-black">{band.label}</p>
                      <p className="mt-2 text-sm leading-relaxed">{band.advice}</p>
                    </div>
                    <div className="rounded-2xl p-5" style={{ background: "#e0f2fe", border: "1px solid #bae6fd" }}>
                      <p className="text-xs font-bold uppercase tracking-wider text-sky-500">Strongest Pillar</p>
                      <p className="mt-2 text-xl font-black text-sky-900">{[...pillarData].sort((a, b) => b.score - a.score)[0].fullName}</p>
                      <p className="mt-1 text-sm text-sky-600 font-semibold">{[...pillarData].sort((a, b) => b.score - a.score)[0].score}%</p>
                    </div>
                    <div className="rounded-2xl p-5" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-500">Priority Development</p>
                      <p className="mt-2 text-xl font-black text-amber-900">{lowestPillars[0].fullName}</p>
                      <p className="mt-1 text-sm text-amber-600 font-semibold">{lowestPillars[0].score}%</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ─── ROADMAP TAB ─── */}
              <TabsContent value="roadmap" className="space-y-5">
                <div className="rounded-2xl bg-white shadow-sm overflow-hidden animate-fade-in" style={{ border: "1px solid #e2e8f0" }}>
                  <div className="px-6 py-5" style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81 60%, #0f3d3e)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.1)" }}>
                        <TrendingUp className="h-5 w-5 text-indigo-200" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-white">12-Month AI Maturity Roadmap</h2>
                        <p className="text-xs text-indigo-200/70 mt-0.5">A phased plan tailored to your current readiness scores and sector context</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid gap-4 md:grid-cols-3 stagger-children">
                      {generateRoadmap(active).map((phase, idx) => (
                        <div key={phase.phase} className="rounded-2xl overflow-hidden hover-lift" style={{ background: phase.bgColor, border: `1px solid ${phase.borderColor}` }}>
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
                                    <span className="text-base leading-none">{item.pillarIcon}</span>
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
                  <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #eef2ff, #f5f3ff)", border: "1px solid #c7d2fe" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-indigo-600" />
                      <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Tailored to You</p>
                    </div>
                    <p className="text-sm text-indigo-900 leading-relaxed">Roadmap actions are derived from your weighted pillar scores and {sectorInfo?.label} sector best practices.</p>
                  </div>
                  <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #f0fdfa, #ecfeff)", border: "1px solid #99f6e4" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-teal-600" />
                      <p className="text-xs font-bold uppercase tracking-wider text-teal-600">Review Quarterly</p>
                    </div>
                    <p className="text-sm text-teal-900 leading-relaxed">Re-run the assessment every 90 days to track progress and reprioritise as capabilities mature.</p>
                  </div>
                  <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #fff7ed, #fefce8)", border: "1px solid #fed7aa" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Phased ROI</p>
                    </div>
                    <p className="text-sm text-amber-900 leading-relaxed">Expect early efficiency gains in Phase 1, transformational impact emerging in Phase 2, and enterprise-wide value in Phase 3.</p>
                  </div>
                </div>
              </TabsContent>

              {/* ─── REPORT TAB ─── */}
              <TabsContent value="report" className="space-y-5">
                <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                  <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <div>
                      <h3 className="font-black text-slate-900 flex items-center gap-2"><FileText className="h-4 w-4 text-sky-600" /> Client Report Summary</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Executive-level summary for stakeholder communication</p>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(generateExecutiveSummary(active))} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition" style={{ background: "#e0f2fe", color: "#0369a1" }}>
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
                        { label: "Maturity Band", badge: <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${band.tone}`}>{band.label}</span> },
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
                            <span className="font-black" style={{ color: PILLAR_COLORS[idx]?.from }}>{pillar.score}%</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pillar.score}%`, background: `linear-gradient(90deg, ${PILLAR_COLORS[idx]?.from || "#0891b2"}, ${PILLAR_COLORS[idx]?.to || "#0369a1"})` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ─── COMPARE TAB ─── */}
              <TabsContent value="compare" className="space-y-4">
                <CompareView assessments={assessments} />
              </TabsContent>

              {/* ─── RECOMMENDATIONS TAB ─── */}
              <TabsContent value="recommendations" className="space-y-5">
                <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                  <div className="px-6 py-4" style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <h2 className="font-black text-white flex items-center gap-2"><Sparkles className="h-4 w-4 text-sky-300" /> Strategic Recommendations</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Sector-specific action items for {sectorInfo?.label} operations</p>
                  </div>
                  <div className="p-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {PILLARS.filter((pillar) => getWeightedPillarScore(pillar, active.scores) < 60).map((pillar) => {
                      const score = getWeightedPillarScore(pillar, active.scores);
                      const color = PILLAR_COLORS[PILLARS.indexOf(pillar)];
                      return (
                        <div key={pillar.id} className="rounded-2xl p-5 hover:shadow-md transition" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderTop: `3px solid ${color.from}` }}>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <p className="font-black text-slate-900 text-sm">{pillar.icon} {pillar.title}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full font-black" style={{ background: `${color.from}15`, color: color.from }}>{score}%</span>
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
                  <div className="rounded-2xl overflow-hidden" style={{ background: "#fff1f2", border: "1px solid #fecdd3" }}>
                    <div className="px-6 py-4" style={{ borderBottom: "1px solid #fecdd3" }}>
                      <h3 className="font-black text-red-900 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Risk Mitigation Priorities</h3>
                      <p className="text-xs text-red-600 mt-0.5">Critical factors requiring immediate attention</p>
                    </div>
                    <div className="p-5 grid gap-3 md:grid-cols-2">
                      {risk.factors.map((factor, idx) => (
                        <div key={idx} className="rounded-xl bg-white p-3" style={{ border: "1px solid #fecdd3" }}>
                          <p className="text-sm font-bold text-red-800">{factor}</p>
                          <p className="text-xs text-red-400 mt-1 font-semibold">Priority: Immediate action required</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
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
