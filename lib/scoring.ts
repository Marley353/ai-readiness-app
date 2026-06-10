// Assessment data model + scoring engine for the AI Readiness app.
// Extracted from components/ai-readiness-scorecard.tsx so the business
// logic is importable, testable, and renderer-agnostic. UI (charts, PDF,
// tabs) stays in the component layer.

import { Compass, Users, Workflow, Database, Cpu, Scale, Heart, Rocket, Zap, Beaker, Building2, type LucideIcon } from "lucide-react";
import { getExternalMaturityLabel } from "@/lib/maturity-labels";

export const STORAGE_KEY = "ai-readiness-assessments-v3";
export const ACTIVE_KEY = "ai-readiness-active-id-v3";

export type ScoreValue = 1 | 2 | 3 | 4 | 5;
export type Sector = "retail" | "fm" | "security" | "logistics" | "manufacturing" | "corporate" | "other";
export type CompanySize = "small" | "medium" | "large" | "enterprise";
export type OperationalComplexity = "low" | "medium" | "high";
export type RiskLevel = "low" | "medium" | "high";

export type Factor = { 
  id: string; 
  label: string; 
  weight: number; // 1-3 (1=standard, 2=important, 3=critical)
  riskCategory: "operational" | "security" | "compliance" | "strategic";
};

export type Pillar = {
  id: string;
  title: string;
  Icon: LucideIcon;
  description: string;
  factors: Factor[];
  strategicRecommendations: Record<Sector, string>;
  businessImpact: string;
};

export type Assessment = {
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

export const SECTORS: { value: Sector; label: string; description: string }[] = [
  { value: "retail", label: "Retail", description: "Consumer-facing, high-volume operations" },
  { value: "fm", label: "Facilities Management", description: "Property, maintenance, and service delivery" },
  { value: "security", label: "Security", description: "Risk-sensitive, compliance-driven operations" },
  { value: "logistics", label: "Logistics", description: "Supply chain and distribution operations" },
  { value: "manufacturing", label: "Manufacturing", description: "Production, assembly, and industrial operations" },
  { value: "corporate", label: "Corporate / Office", description: "Professional services and administrative functions" },
  { value: "other", label: "Other", description: "Specialised or emerging sectors" },
];

export const COMPANY_SIZES: { value: CompanySize; label: string; description: string }[] = [
  { value: "small", label: "Small", description: "1-50 employees" },
  { value: "medium", label: "Medium", description: "51-250 employees" },
  { value: "large", label: "Large", description: "251-1000 employees" },
  { value: "enterprise", label: "Enterprise", description: "1000+ employees" },
];

export const REVENUE_RANGES = [
  "Under £1M",
  "£1M - £10M",
  "£10M - £50M",
  "£50M - £100M",
  "£100M - £500M",
  "£500M+",
];

export const COMPLEXITY_LEVELS: { value: OperationalComplexity; label: string; description: string }[] = [
  { value: "low", label: "Low", description: "Single site, straightforward operations" },
  { value: "medium", label: "Medium", description: "Multiple sites, moderate integration needs" },
  { value: "high", label: "High", description: "Complex multi-site, highly integrated operations" },
];

export const SCALE: Record<ScoreValue, string> = {
  1: "Not started",
  2: "Early stage",
  3: "Developing",
  4: "Established",
  5: "Optimised",
};

// Short labels that fit inside the narrow score buttons (full text is still
// shown in the "Selected: X - Label" line below the buttons).
export const SHORT_SCALE: Record<ScoreValue, string> = {
  1: "None",
  2: "Early",
  3: "Dev",
  4: "Est",
  5: "Opt",
};

export const PILLARS: Pillar[] = [
  {
    id: "strategy",
    title: "Strategy & Leadership",
    Icon: Compass,
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
    Icon: Users,
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
    Icon: Workflow,
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
    Icon: Database,
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
    Icon: Cpu,
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
    Icon: Scale,
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
    Icon: Heart,
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
    Icon: Rocket,
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
export const INDUSTRY_BENCHMARKS: Record<Sector, Record<string, number>> = {
  retail:        { strategy: 48, people: 42, process: 52, data: 45, tech: 50, ethics: 38, culture: 44, innovation: 40 },
  fm:            { strategy: 40, people: 36, process: 48, data: 40, tech: 44, ethics: 34, culture: 38, innovation: 32 },
  security:      { strategy: 52, people: 44, process: 50, data: 48, tech: 55, ethics: 50, culture: 40, innovation: 38 },
  logistics:     { strategy: 45, people: 40, process: 55, data: 44, tech: 48, ethics: 36, culture: 42, innovation: 36 },
  manufacturing: { strategy: 50, people: 38, process: 58, data: 46, tech: 52, ethics: 40, culture: 36, innovation: 42 },
  corporate:     { strategy: 55, people: 50, process: 45, data: 48, tech: 50, ethics: 48, culture: 52, innovation: 44 },
  other:         { strategy: 45, people: 40, process: 48, data: 42, tech: 46, ethics: 38, culture: 42, innovation: 36 },
};

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function makeBlankAssessment(name = "New Assessment"): Assessment {
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
export function getWeightedPillarScore(pillar: Pillar, scores: Record<string, ScoreValue>) {
  let totalWeight = 0;
  let weightedSum = 0;
  
  pillar.factors.forEach((factor) => {
    const score = scores[factor.id] ?? 2;
    weightedSum += (score - 1) * factor.weight; // Normalize to 0-4 range
    totalWeight += factor.weight * 4; // Max possible weighted score
  });
  
  return Math.round((weightedSum / totalWeight) * 100);
}

export function getWeightedOverallScore(assessment: Assessment) {
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
export function getRiskScore(assessment: Assessment): { level: RiskLevel; score: number; factors: string[] } {
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
export function getBusinessImpact(assessment: Assessment): { category: string; description: string; color: string } {
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
export function getOperationalImpactScore(assessment: Assessment): number {
  const processScore = getWeightedPillarScore(PILLARS.find((p) => p.id === "process")!, assessment.scores);
  const techScore = getWeightedPillarScore(PILLARS.find((p) => p.id === "tech")!, assessment.scores);
  const dataScore = getWeightedPillarScore(PILLARS.find((p) => p.id === "data")!, assessment.scores);
  
  // Weighted average with process having highest impact
  return Math.round((processScore * 0.4 + techScore * 0.3 + dataScore * 0.3));
}

// Efficiency Opportunity Score
export function getEfficiencyOpportunityScore(assessment: Assessment): number {
  const overall = getWeightedOverallScore(assessment);
  const processScore = getWeightedPillarScore(PILLARS.find((p) => p.id === "process")!, assessment.scores);
  
  // Lower current scores mean higher opportunity for improvement
  const opportunityGap = 100 - overall;
  const processGap = 100 - processScore;
  
  // Combine gaps with current capability to estimate realistic opportunity
  return Math.round((opportunityGap * 0.5 + processGap * 0.3 + (overall * 0.2)));
}

// Risk Exposure Score (0-100, higher = more exposed)
export function getRiskExposureScore(assessment: Assessment): number {
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
export function getTopOpportunities(assessment: Assessment): { title: string; description: string; impact: string }[] {
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
export function getTopRisks(assessment: Assessment): { title: string; description: string; severity: string }[] {
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
export function getROIOpportunity(assessment: Assessment): { range: string; confidence: string; drivers: string[]; scenarios: { low: string; mid: string; high: string } } {
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

export function getBand(score: number) {
  if (score >= 80) return { label: "Advanced", advice: "Organisation demonstrates mature AI capabilities across all dimensions. Ready for scaled deployment and enterprise-wide transformation.", tone: "bg-emerald-500/10 text-emerald-700 border-emerald-200" };
  if (score >= 60) return { label: "Progressing", advice: "Good momentum with established capabilities in key areas. Focus on consistency and addressing remaining gaps to unlock full potential.", tone: "bg-blue-500/10 text-blue-700 border-blue-200" };
  if (score >= 40) return { label: "Emerging", advice: "Foundations are forming but capability remains uneven. Targeted investment in weak areas will accelerate readiness.", tone: "bg-amber-500/10 text-amber-700 border-amber-200" };
  return { label: "Early", advice: "Organisation is in early stages of AI readiness. A structured approach to strategy, data, and capability building is recommended.", tone: "bg-red-500/10 text-red-700 border-red-200" };
}

export function generateExecutiveSummary(assessment: Assessment): string {
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

Overall Readiness: ${overall}% — ${getExternalMaturityLabel(band.label)} (${band.label})

${assessment.businessName || "The organisation"} is classified as a ${getExternalMaturityLabel(band.label)} (${band.label}) with an overall AI readiness score of ${overall}%. ${band.advice}

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
export type RoadmapPriority = "Critical" | "Important" | "Strategic" | "Standard";
export type RoadmapItem = { pillar: string; PillarIcon: LucideIcon; action: string; priority: RoadmapPriority; score: number };
export type RoadmapPhase = {
  phase: string;
  timeline: string;
  focus: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  items: RoadmapItem[];
};

export function generateRoadmap(assessment: Assessment): RoadmapPhase[] {
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
      PillarIcon: pillar.Icon,
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
      color: "#9f1239",
      bgColor: "#ffffff",
      borderColor: "#e2e8f0",
      items: critical.length > 0
        ? buildItems(critical, "Critical")
        : [{ pillar: "Quick Wins", PillarIcon: Zap, action: "Identify 2-3 lower-risk AI use cases that can deliver value within 60 days while broader capability building continues.", priority: "Standard", score: 70 }],
    },
    {
      phase: "Phase 2 — Build",
      timeline: "3–6 Months",
      focus: "Develop capabilities & run targeted pilots",
      description: "Move beyond foundations: build skills, launch focused pilots, and create the operating model for sustainable AI delivery.",
      color: "#854d0e",
      bgColor: "#ffffff",
      borderColor: "#e2e8f0",
      items: developing.length > 0
        ? buildItems(developing, "Important")
        : [{ pillar: "Pilot Acceleration", PillarIcon: Beaker, action: "Scale successful pilots to wider business units and deepen cross-functional integration of AI tools.", priority: "Important", score: 60 }],
    },
    {
      phase: "Phase 3 — Scale",
      timeline: "6–12 Months",
      focus: "Scale proven solutions & measure impact",
      description: "Translate proven pilots into enterprise-wide deployment with clear governance, KPIs and continuous improvement loops.",
      color: "#065f46",
      bgColor: "#ffffff",
      borderColor: "#e2e8f0",
      items: strong.length > 0
        ? buildItems(strong.slice(0, 4), "Strategic")
        : [{ pillar: "Enterprise Scaling", PillarIcon: Building2, action: "Establish enterprise AI governance, value tracking, and a continuous improvement framework across all business units.", priority: "Strategic", score: 75 }],
    },
  ];
}
