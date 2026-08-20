// ============================================
// TREND FORGE AI — AI Integration Layer
// ============================================
// This module defines the interface for AI-powered content generation.
// It requires an OPENAI_API_KEY environment variable to function.
// Without it, the system uses built-in templates and algorithms.

import { calculateOpportunityScore, suggestToolType, suggestCategory } from './score';
import { slugify, currentTimestamp, today } from './utils';
import type { Topic } from './types';

// Check if AI is configured
export function isAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

// ============================================
// Trend Discovery — Generate seed opportunities
// ============================================

interface TrendSeed {
  topic: string;
  category: string;
  demand: number;
  growth: number;
  commercialIntent: number;
  toolPotential: number;
  competition: number;
  source: string;
  relatedKeywords: string[];
}

const SEED_TRENDS: TrendSeed[] = [
  // Gaming
  {
    topic: 'How much does a gaming PC cost?',
    category: 'gaming',
    demand: 88, growth: 72, commercialIntent: 92, toolPotential: 95, competition: 55,
    source: 'seed', relatedKeywords: ['gaming pc price', 'build gaming pc budget', 'cheap gaming pc'],
  },
  {
    topic: 'Can my PC run Minecraft shaders?',
    category: 'gaming',
    demand: 82, growth: 65, commercialIntent: 68, toolPotential: 94, competition: 40,
    source: 'seed', relatedKeywords: ['minecraft fps calculator', 'can i run minecraft', 'minecraft shader performance'],
  },
  {
    topic: 'What FPS will I get in Fortnite?',
    category: 'gaming',
    demand: 78, growth: 58, commercialIntent: 72, toolPotential: 90, competition: 45,
    source: 'seed', relatedKeywords: ['fortnite fps calculator', 'fortnite performance', 'pc performance fortnite'],
  },
  {
    topic: 'How much RAM do I need for gaming?',
    category: 'gaming',
    demand: 74, growth: 62, commercialIntent: 80, toolPotential: 88, competition: 38,
    source: 'seed', relatedKeywords: ['gaming ram', 'ram for gaming 2024', 'how much ram games'],
  },
  {
    topic: 'Best GPU for the money?',
    category: 'gaming',
    demand: 85, growth: 70, commercialIntent: 95, toolPotential: 92, competition: 60,
    source: 'seed', relatedKeywords: ['best graphics card', 'gpu value', 'gpu benchmark comparison'],
  },
  {
    topic: 'PC bottleneck calculator',
    category: 'gaming',
    demand: 70, growth: 55, commercialIntent: 70, toolPotential: 96, competition: 35,
    source: 'seed', relatedKeywords: ['bottleneck calculator', 'cpu gpu bottleneck', 'pc bottleneck'],
  },
  {
    topic: 'Power supply calculator',
    category: 'gaming',
    demand: 68, growth: 50, commercialIntent: 75, toolPotential: 93, competition: 30,
    source: 'seed', relatedKeywords: ['psu calculator', 'how many watts do i need', 'power supply wattage'],
  },

  // Finance
  {
    topic: 'How much house can I afford?',
    category: 'finance',
    demand: 95, growth: 68, commercialIntent: 98, toolPotential: 97, competition: 65,
    source: 'seed', relatedKeywords: ['home affordability calculator', 'how much house mortgage', 'home buying budget'],
  },
  {
    topic: 'Mortgage calculator with taxes and insurance',
    category: 'finance',
    demand: 92, growth: 55, commercialIntent: 96, toolPotential: 95, competition: 70,
    source: 'seed', relatedKeywords: ['mortgage calculator', 'monthly payment calculator', 'home loan calculator'],
  },
  {
    topic: 'How much should I save for retirement?',
    category: 'finance',
    demand: 80, growth: 60, commercialIntent: 88, toolPotential: 90, competition: 50,
    source: 'seed', relatedKeywords: ['retirement calculator', '401k calculator', 'savings calculator'],
  },
  {
    topic: 'Student loan payment calculator',
    category: 'finance',
    demand: 85, growth: 65, commercialIntent: 90, toolPotential: 92, competition: 55,
    source: 'seed', relatedKeywords: ['student loan calculator', 'loan repayment', 'student debt calculator'],
  },
  {
    topic: 'Car affordability calculator',
    category: 'finance',
    demand: 75, growth: 58, commercialIntent: 94, toolPotential: 88, competition: 45,
    source: 'seed', relatedKeywords: ['how much car can i afford', 'auto loan calculator', 'car payment calculator'],
  },
  {
    topic: 'Compound interest calculator',
    category: 'finance',
    demand: 72, growth: 55, commercialIntent: 82, toolPotential: 90, competition: 50,
    source: 'seed', relatedKeywords: ['compound interest', 'interest calculator', 'investment growth'],
  },
  {
    topic: 'Investment return calculator',
    category: 'finance',
    demand: 70, growth: 62, commercialIntent: 85, toolPotential: 88, competition: 52,
    source: 'seed', relatedKeywords: ['roi calculator', 'investment calculator', 'return on investment'],
  },

  // Education
  {
    topic: 'SAT score to percentile calculator',
    category: 'education',
    demand: 80, growth: 50, commercialIntent: 70, toolPotential: 94, competition: 35,
    source: 'seed', relatedKeywords: ['sat percentile', 'sat score chart', 'sat conversion'],
  },
  {
    topic: 'GPA calculator',
    category: 'education',
    demand: 85, growth: 45, commercialIntent: 60, toolPotential: 92, competition: 40,
    source: 'seed', relatedKeywords: ['gpa calculator', 'grade calculator', 'college gpa'],
  },
  {
    topic: 'How much does college cost?',
    category: 'education',
    demand: 78, growth: 55, commercialIntent: 85, toolPotential: 90, competition: 45,
    source: 'seed', relatedKeywords: ['college cost calculator', 'tuition calculator', 'college savings'],
  },
  {
    topic: 'What GRE score do I need?',
    category: 'education',
    demand: 55, growth: 42, commercialIntent: 65, toolPotential: 85, competition: 30,
    source: 'seed', relatedKeywords: ['gre score', 'gre percentiles', 'grad school requirements'],
  },

  // Fitness
  {
    topic: 'How much protein should I eat?',
    category: 'fitness',
    demand: 82, growth: 68, commercialIntent: 78, toolPotential: 93, competition: 42,
    source: 'seed', relatedKeywords: ['protein calculator', 'daily protein intake', 'protein needs'],
  },
  {
    topic: 'How many calories do I need?',
    category: 'fitness',
    demand: 88, growth: 65, commercialIntent: 80, toolPotential: 95, competition: 48,
    source: 'seed', relatedKeywords: ['calorie calculator', 'tdee calculator', 'daily calories'],
  },
  {
    topic: 'BMI calculator',
    category: 'fitness',
    demand: 90, growth: 40, commercialIntent: 65, toolPotential: 88, competition: 55,
    source: 'seed', relatedKeywords: ['bmi calculator', 'body mass index', 'healthy weight'],
  },
  {
    topic: 'Macro calculator for weight loss',
    category: 'fitness',
    demand: 76, growth: 72, commercialIntent: 75, toolPotential: 92, competition: 40,
    source: 'seed', relatedKeywords: ['macro calculator', 'macros for weight loss', 'macro split'],
  },

  // Technology / AI
  {
    topic: 'AI ROI calculator for business',
    category: 'ai',
    demand: 65, growth: 92, commercialIntent: 90, toolPotential: 88, competition: 25,
    source: 'seed', relatedKeywords: ['ai roi', 'ai investment', 'ai business value'],
  },
  {
    topic: 'How much does AI cost to run?',
    category: 'ai',
    demand: 58, growth: 88, commercialIntent: 82, toolPotential: 85, competition: 20,
    source: 'seed', relatedKeywords: ['ai costs', 'api costs', 'chatgpt cost'],
  },
  {
    topic: 'AI tool comparison',
    category: 'ai',
    demand: 72, growth: 95, commercialIntent: 88, toolPotential: 90, competition: 30,
    source: 'seed', relatedKeywords: ['best ai tools', 'ai tools comparison', 'chatgpt vs claude'],
  },

  // Career
  {
    topic: 'Salary calculator by job title',
    category: 'career',
    demand: 82, growth: 55, commercialIntent: 80, toolPotential: 90, competition: 50,
    source: 'seed', relatedKeywords: ['salary calculator', 'average salary', 'pay scale'],
  },
  {
    topic: 'Is this salary offer fair?',
    category: 'career',
    demand: 70, growth: 60, commercialIntent: 75, toolPotential: 88, competition: 35,
    source: 'seed', relatedKeywords: ['salary negotiation', 'salary comparison', 'fair salary'],
  },

  // Travel
  {
    topic: 'How much does a vacation cost?',
    category: 'travel',
    demand: 75, growth: 58, commercialIntent: 85, toolPotential: 88, competition: 45,
    source: 'seed', relatedKeywords: ['vacation budget', 'trip cost calculator', 'travel budget'],
  },

  // Shopping
  {
    topic: 'Best laptop for engineering students',
    category: 'shopping',
    demand: 72, growth: 55, commercialIntent: 95, toolPotential: 90, competition: 50,
    source: 'seed', relatedKeywords: ['best engineering laptop', 'laptop for engineering', 'college laptop'],
  },
  {
    topic: 'Best gaming monitor?',
    category: 'shopping',
    demand: 78, growth: 60, commercialIntent: 92, toolPotential: 88, competition: 52,
    source: 'seed', relatedKeywords: ['gaming monitor comparison', 'best gaming monitor', 'monitor for gaming'],
  },

  // Wedding
  {
    topic: 'How much does a wedding cost?',
    category: 'lifestyle',
    demand: 80, growth: 50, commercialIntent: 88, toolPotential: 92, competition: 48,
    source: 'seed', relatedKeywords: ['wedding budget', 'wedding cost calculator', 'average wedding price'],
  },
  {
    topic: 'Wedding budget planner',
    category: 'lifestyle',
    demand: 72, growth: 48, commercialIntent: 85, toolPotential: 94, competition: 42,
    source: 'seed', relatedKeywords: ['wedding planner budget', 'wedding spending', 'wedding cost breakdown'],
  },

  // Home
  {
    topic: 'How much to renovate a kitchen?',
    category: 'home',
    demand: 68, growth: 52, commercialIntent: 82, toolPotential: 88, competition: 40,
    source: 'seed', relatedKeywords: ['kitchen renovation cost', 'remodel budget', 'home improvement cost'],
  },
  {
    topic: 'Energy cost calculator',
    category: 'home',
    demand: 65, growth: 60, commercialIntent: 75, toolPotential: 90, competition: 35,
    source: 'seed', relatedKeywords: ['electricity cost calculator', 'energy bill', 'solar savings'],
  },
];

/**
 * Generate initial seed topics from built-in trend data.
 * Returns Topic objects ready to insert into the database.
 */
export function generateSeedTopics(): Omit<Topic, 'id' | 'date_discovered' | 'date_updated'>[] {
  return SEED_TRENDS.map(seed => {
    const opp = calculateOpportunityScore({
      demand: seed.demand,
      growth: seed.growth,
      commercialIntent: seed.commercialIntent,
      toolPotential: seed.toolPotential,
      competition: seed.competition,
    });

    return {
      topic: seed.topic,
      slug: slugify(seed.topic),
      category: seed.category,
      trend_score: (seed.demand + seed.growth) / 2,
      growth_rate: seed.growth,
      estimated_demand: seed.demand,
      commercial_intent: seed.commercialIntent,
      competition: seed.competition,
      tool_potential: seed.toolPotential,
      opportunity_score: opp.score,
      related_keywords: JSON.stringify(seed.relatedKeywords),
      status: 'discovered' as const,
      source: seed.source,
    };
  });
}

// ============================================
// Tool Content Generation
// ============================================

interface ToolSpec {
  title: string;
  slug: string;
  description: string;
  toolType: string;
  category: string;
  inputsSchema: Record<string, unknown>;
  outputsSchema: Record<string, unknown>;
  htmlContent: string;
  metaTitle: string;
  metaDescription: string;
  faqs: { question: string; answer: string }[];
  affiliateProducts: { name: string; category: string; description: string }[];
  relatedSlugs: string[];
}

/**
 * Generate a tool specification from a topic.
 * Uses templates and algorithms — no external AI required.
 * If OPENAI_API_KEY is set, can enhance with AI generation.
 */
export function generateToolSpec(topic: Topic): ToolSpec {
  const toolType = suggestToolType(topic.topic);
  const toolSpecs: Record<string, ToolSpec> = {
    calculator: generateCalculatorSpec(topic),
    comparison: generateComparisonSpec(topic),
    recommendation: generateRecommendationSpec(topic),
    estimator: generateEstimatorSpec(topic),
    planner: generatePlannerSpec(topic),
    converter: generateConverterSpec(topic),
    quiz: generateQuizSpec(topic),
    generator: generateGeneratorSpec(topic),
    simulator: generateSimulatorSpec(topic),
    tracker: generateTrackerSpec(topic),
  };

  return toolSpecs[toolType] || generateCalculatorSpec(topic);
}

// ---- Calculator Templates ----

const CALCULATORS: Record<string, (topic: Topic) => ToolSpec> = {
  'gaming': (topic) => ({
    title: 'Gaming PC Budget Calculator',
    slug: 'gaming-pc-budget-calculator',
    description: 'Build your ideal gaming PC within your budget. Get personalized component recommendations based on your resolution, target FPS, and the games you play.',
    toolType: 'calculator',
    category: 'gaming',
    inputsSchema: {
      budget: { type: 'number', label: 'Budget ($)', min: 300, max: 10000, default: 1000, step: 50 },
      resolution: { type: 'select', label: 'Target Resolution', options: ['1080p', '1440p', '4K'], default: '1080p' },
      targetFps: { type: 'number', label: 'Target FPS', min: 30, max: 240, default: 60, step: 15 },
      games: { type: 'text', label: 'Main Games (comma-separated)', default: 'Fortnite, Minecraft, Valorant' },
    },
    outputsSchema: {
      cpu: { type: 'text', label: 'Recommended CPU' },
      gpu: { type: 'text', label: 'Recommended GPU' },
      ram: { type: 'text', label: 'Recommended RAM' },
      storage: { type: 'text', label: 'Recommended Storage' },
      estimatedFps: { type: 'text', label: 'Estimated FPS Range' },
      totalCost: { type: 'text', label: 'Estimated Total Cost' },
    },
    htmlContent: buildGamingPCCalculatorHTML(topic),
    metaTitle: 'Gaming PC Budget Calculator — Build Your Perfect Gaming Rig | TrendForge',
    metaDescription: 'Calculate the perfect gaming PC build for your budget. Get recommendations for CPU, GPU, RAM, and more based on your resolution and target FPS.',
    faqs: [
      { question: 'How does this calculator work?', answer: 'We analyze your budget, target resolution, and desired performance to recommend the best component combination. Recommendations are based on current market pricing and benchmark data.' },
      { question: 'Are these real prices?', answer: 'Prices are estimates based on current market averages. Actual prices may vary by retailer and region. Check current prices before purchasing.' },
      { question: 'Can I upgrade later?', answer: 'Yes! We recommend choosing a motherboard and PSU that leave room for future upgrades. Check our PC Upgrade Calculator for specific guidance.' },
    ],
    affiliateProducts: [
      { name: 'AMD Ryzen 5 7600X', category: 'CPU', description: 'Excellent mid-range gaming CPU' },
      { name: 'NVIDIA RTX 4070', category: 'GPU', description: 'Great 1440p gaming performance' },
      { name: 'Corsair Vengeance 32GB DDR5', category: 'RAM', description: 'Fast gaming memory' },
    ],
    relatedSlugs: ['gpu-benchmark-calculator', 'pc-bottleneck-calculator', 'power-supply-calculator'],
  }),
  'finance': (topic) => ({
    title: 'Home Affordability Calculator',
    slug: 'home-affordability-calculator',
    description: 'Find out how much house you can afford based on your income, down payment, and debts. Get estimated monthly payments and see what you qualify for.',
    toolType: 'calculator',
    category: 'finance',
    inputsSchema: {
      annualIncome: { type: 'number', label: 'Annual Gross Income ($)', min: 20000, max: 1000000, default: 80000, step: 5000 },
      monthlyDebt: { type: 'number', label: 'Monthly Debt Payments ($)', min: 0, max: 5000, default: 500, step: 50 },
      downPayment: { type: 'number', label: 'Down Payment ($)', min: 0, max: 500000, default: 50000, step: 5000 },
      interestRate: { type: 'number', label: 'Interest Rate (%)', min: 1, max: 10, default: 6.5, step: 0.1 },
      loanTerm: { type: 'select', label: 'Loan Term', options: ['15 years', '20 years', '30 years'], default: '30 years' },
    },
    outputsSchema: {
      maxPrice: { type: 'text', label: 'Estimated Maximum Home Price' },
      monthlyPayment: { type: 'text', label: 'Estimated Monthly Payment' },
      dtiRatio: { type: 'text', label: 'Debt-to-Income Ratio' },
      totalInterest: { type: 'text', label: 'Total Interest Paid' },
    },
    htmlContent: buildMortgageCalculatorHTML(topic),
    metaTitle: 'Home Affordability Calculator — How Much House Can I Afford? | TrendForge',
    metaDescription: 'Find out how much house you can afford with our free calculator. Based on your income, debts, and down payment, see your estimated maximum home price.',
    faqs: [
      { question: 'How accurate is this calculator?', answer: 'This provides an estimate based on standard lending guidelines (28/36 rule). Actual loan approval depends on credit score, employment history, and lender criteria. Consult a mortgage professional for precise figures.' },
      { question: 'What is a good debt-to-income ratio?', answer: 'Most lenders prefer a total DTI of 36% or lower, with housing costs under 28%. FHA loans may allow up to 43%.' },
      { question: 'Does this include property taxes and insurance?', answer: 'This calculator provides a baseline estimate. Property taxes, insurance, HOA fees, and PMI (if applicable) will increase your actual monthly payment.' },
    ],
    affiliateProducts: [
      { name: 'Mortgage Pre-Approval', category: 'Finance', description: 'Get pre-approved with our partner lenders' },
      { name: 'Home Insurance Quotes', category: 'Insurance', description: 'Compare home insurance rates' },
    ],
    relatedSlugs: ['mortgage-calculator', 'auto-loan-calculator', 'retirement-calculator'],
  }),
  'education': (topic) => ({
    title: 'GPA Calculator',
    slug: 'gpa-calculator',
    description: 'Calculate your GPA quickly and accurately. Supports standard 4.0 scale, weighted GPAs, and lets you track your academic progress across semesters.',
    toolType: 'calculator',
    category: 'education',
    inputsSchema: {
      scale: { type: 'select', label: 'GPA Scale', options: ['4.0 (Standard)', '5.0 (Weighted)', '100-point'], default: '4.0 (Standard)' },
    },
    outputsSchema: {
      gpa: { type: 'text', label: 'Your GPA' },
      letterGrade: { type: 'text', label: 'Equivalent Letter Grade' },
      classification: { type: 'text', label: 'Academic Standing' },
    },
    htmlContent: buildGPACalculatorHTML(topic),
    metaTitle: 'GPA Calculator — Calculate Your Grade Point Average | TrendForge',
    metaDescription: 'Free GPA calculator. Enter your grades to instantly calculate your GPA on 4.0 or weighted scales. Track your academic progress.',
    faqs: [
      { question: 'How is GPA calculated?', answer: 'GPA = Total Quality Points / Total Credit Hours. Each grade is converted to quality points (A=4.0, B=3.0, etc.) and multiplied by the course credits.' },
      { question: 'What is a weighted GPA?', answer: 'A weighted GPA gives extra points for honors or AP classes (e.g., A in AP = 5.0 instead of 4.0). This rewards academic rigor.' },
    ],
    affiliateProducts: [],
    relatedSlugs: ['sat-score-calculator', 'college-cost-calculator', 'study-planner'],
  }),
  'fitness': (topic) => ({
    title: 'Protein Intake Calculator',
    slug: 'protein-intake-calculator',
    description: 'Calculate your optimal daily protein intake based on your body weight, activity level, and fitness goals. Backed by sports nutrition guidelines.',
    toolType: 'calculator',
    category: 'fitness',
    inputsSchema: {
      weight: { type: 'number', label: 'Body Weight (lbs)', min: 80, max: 500, default: 160, step: 5 },
      activityLevel: { type: 'select', label: 'Activity Level', options: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Athlete'], default: 'Moderately Active' },
      goal: { type: 'select', label: 'Primary Goal', options: ['General Health', 'Weight Loss', 'Muscle Building', 'Athletic Performance'], default: 'General Health' },
    },
    outputsSchema: {
      minProtein: { type: 'text', label: 'Minimum Daily Protein (g)' },
      maxProtein: { type: 'text', label: 'Maximum Daily Protein (g)' },
      perKg: { type: 'text', label: 'Per kg of body weight' },
    },
    htmlContent: buildProteinCalculatorHTML(topic),
    metaTitle: 'Protein Intake Calculator — How Much Protein Do You Need? | TrendForge',
    metaDescription: 'Calculate your ideal daily protein intake. Free calculator based on your weight, activity level, and fitness goals.',
    faqs: [
      { question: 'How much protein do I need per day?', answer: 'General guidelines: 0.8g per kg for sedentary adults, 1.2-1.6g/kg for active individuals, and 1.6-2.2g/kg for those building muscle. Our calculator personalizes this for you.' },
      { question: 'Can you eat too much protein?', answer: 'For most healthy adults, protein intake up to 2.2g/kg body weight is considered safe. Excessive intake beyond your needs is simply used for energy or stored. People with kidney conditions should consult a doctor.' },
    ],
    affiliateProducts: [
      { name: 'Optimum Nutrition Gold Standard Whey', category: 'Supplements', description: 'High-quality protein powder' },
      { name: 'MyProtein Impact Whey', category: 'Supplements', description: 'Value protein supplement' },
    ],
    relatedSlugs: ['calorie-calculator', 'bmi-calculator', 'macro-calculator'],
  }),
  'ai': (topic) => ({
    title: 'AI ROI Calculator for Business',
    slug: 'ai-roi-calculator',
    description: 'Calculate the return on investment for implementing AI in your business. Estimate time savings, cost reductions, and revenue impact.',
    toolType: 'calculator',
    category: 'ai',
    inputsSchema: {
      employees: { type: 'number', label: 'Number of Employees', min: 1, max: 10000, default: 50, step: 5 },
      avgSalary: { type: 'number', label: 'Average Salary ($)', min: 20000, max: 500000, default: 75000, step: 5000 },
      aiCost: { type: 'number', label: 'Monthly AI Tool Cost ($)', min: 0, max: 100000, default: 500, step: 100 },
      timeSavedPct: { type: 'number', label: 'Estimated Time Saved (%)', min: 1, max: 80, default: 20, step: 5 },
    },
    outputsSchema: {
      annualSavings: { type: 'text', label: 'Estimated Annual Savings' },
      roi: { type: 'text', label: 'ROI Percentage' },
      paybackPeriod: { type: 'text', label: 'Payback Period' },
    },
    htmlContent: buildAiroiCalculatorHTML(topic),
    metaTitle: 'AI ROI Calculator — Calculate AI Return on Investment | TrendForge',
    metaDescription: 'Calculate the return on investment for AI tools in your business. Estimate savings, time recovery, and payback period.',
    faqs: [
      { question: 'How accurate are these estimates?', answer: 'Results are illustrative estimates based on industry averages for AI adoption. Actual ROI varies significantly by use case, implementation quality, and organization. Use this as a starting point for your analysis.' },
    ],
    affiliateProducts: [
      { name: 'ChatGPT Plus', category: 'AI Tools', description: 'AI assistant for productivity' },
      { name: 'Notion AI', category: 'Productivity', description: 'AI-powered workspace' },
    ],
    relatedSlugs: ['ai-tool-comparison', 'productivity-calculator', 'salary-calculator'],
  }),
  'career': (topic) => ({
    title: 'Salary Calculator by Job Title',
    slug: 'salary-calculator',
    description: 'Look up average salaries by job title, location, and experience level. Compare your compensation to market rates.',
    toolType: 'calculator',
    category: 'career',
    inputsSchema: {
      jobTitle: { type: 'text', label: 'Job Title', default: 'Software Engineer' },
      location: { type: 'text', label: 'Location', default: 'San Francisco, CA' },
      experience: { type: 'select', label: 'Experience Level', options: ['Entry Level', 'Mid Level', 'Senior', 'Lead/Principal', 'Director+'], default: 'Mid Level' },
    },
    outputsSchema: {
      avgSalary: { type: 'text', label: 'Average Salary' },
      salaryRange: { type: 'text', label: 'Typical Range' },
      percentile: { type: 'text', label: 'National Percentile' },
    },
    htmlContent: buildSalaryCalculatorHTML(topic),
    metaTitle: 'Salary Calculator — Average Salary by Job Title & Location | TrendForge',
    metaDescription: 'Look up average salaries by job title and location. Compare your compensation to market rates for your experience level.',
    faqs: [
      { question: 'Where does salary data come from?', answer: 'Salary estimates are based on aggregated industry data and compensation surveys. These are estimates — actual salaries vary by company, industry, and individual qualifications.' },
    ],
    affiliateProducts: [
      { name: 'LinkedIn Premium', category: 'Career', description: 'Professional networking and job search' },
      { name: 'Indeed Resume', category: 'Career', description: 'Job search and resume tools' },
    ],
    relatedSlugs: ['salary-negotiation-calculator', 'cost-of-living-calculator', 'tax-calculator'],
  }),
  'travel': (topic) => ({
    title: 'Vacation Budget Calculator',
    slug: 'vacation-budget-calculator',
    description: 'Plan your dream vacation within budget. Estimate costs for flights, hotels, food, activities, and transportation at your destination.',
    toolType: 'calculator',
    category: 'travel',
    inputsSchema: {
      destination: { type: 'text', label: 'Destination', default: 'Paris, France' },
      days: { type: 'number', label: 'Number of Days', min: 1, max: 90, default: 7, step: 1 },
      travelers: { type: 'number', label: 'Number of Travelers', min: 1, max: 10, default: 2, step: 1 },
      style: { type: 'select', label: 'Travel Style', options: ['Budget', 'Moderate', 'Comfortable', 'Luxury'], default: 'Moderate' },
    },
    outputsSchema: {
      flights: { type: 'text', label: 'Estimated Flights' },
      hotel: { type: 'text', label: 'Estimated Accommodation' },
      food: { type: 'text', label: 'Estimated Food & Drink' },
      activities: { type: 'text', label: 'Estimated Activities' },
      total: { type: 'text', label: 'Total Estimated Cost' },
      perDay: { type: 'text', label: 'Per Person Per Day' },
    },
    htmlContent: buildVacationCalculatorHTML(topic),
    metaTitle: 'Vacation Budget Calculator — Plan Your Trip Cost | TrendForge',
    metaDescription: 'Plan your vacation budget with our free calculator. Estimate flights, hotels, food, and activities for any destination.',
    faqs: [
      { question: 'How are costs estimated?', answer: 'We use average costs for your destination and travel style as guidelines. Actual costs vary by season, booking time, and availability. Use as a planning starting point.' },
    ],
    affiliateProducts: [
      { name: 'Booking.com Hotels', category: 'Travel', description: 'Find the best hotel deals' },
      { name: 'Skyscanner Flights', category: 'Travel', description: 'Compare flight prices' },
    ],
    relatedSlugs: ['mortgage-calculator', 'wedding-budget-calculator', 'vacation-planner'],
  }),
  'shopping': (topic) => ({
    title: 'Best Laptop Finder',
    slug: 'best-laptop-finder',
    description: 'Find the perfect laptop for your needs. Compare options by use case, budget, and features to get personalized recommendations.',
    toolType: 'recommendation',
    category: 'shopping',
    inputsSchema: {
      useCase: { type: 'select', label: 'Primary Use', options: ['Gaming', 'Programming', 'Design', 'Business', 'Student', 'General Use'], default: 'General Use' },
      budget: { type: 'number', label: 'Budget ($)', min: 200, max: 5000, default: 1000, step: 100 },
      portability: { type: 'select', label: 'Portability Priority', options: ['Very Important', 'Somewhat', 'Not Important'], default: 'Somewhat' },
    },
    outputsSchema: {
      recommendation: { type: 'text', label: 'Top Recommendation' },
      alternative: { type: 'text', label: 'Budget Alternative' },
      premium: { type: 'text', label: 'Premium Pick' },
    },
    htmlContent: buildLaptopFinderHTML(topic),
    metaTitle: 'Best Laptop Finder — Find Your Perfect Laptop | TrendForge',
    metaDescription: 'Find the best laptop for gaming, programming, design, or business. Get personalized recommendations based on your budget and needs.',
    faqs: [
      { question: 'How do you recommend laptops?', answer: 'We match your use case, budget, and preferences against current market options. Recommendations are based on performance benchmarks, user reviews, and value for money.' },
    ],
    affiliateProducts: [
      { name: 'MacBook Air M3', category: 'Laptops', description: 'Best for students and productivity' },
      { name: 'ASUS ROG Zephyrus', category: 'Laptops', description: 'Top gaming laptop' },
      { name: 'ThinkPad X1 Carbon', category: 'Laptops', description: 'Business ultrabook' },
    ],
    relatedSlugs: ['gaming-monitor-finder', 'gpu-comparison', 'tech-deals'],
  }),
  'lifestyle': (topic) => ({
    title: 'Wedding Budget Planner',
    slug: 'wedding-budget-planner',
    description: 'Plan your perfect wedding within budget. Get a detailed breakdown of typical costs and track spending across all categories.',
    toolType: 'planner',
    category: 'lifestyle',
    inputsSchema: {
      totalBudget: { type: 'number', label: 'Total Budget ($)', min: 5000, max: 200000, default: 30000, step: 1000 },
      guestCount: { type: 'number', label: 'Number of Guests', min: 10, max: 500, default: 100, step: 5 },
      location: { type: 'select', label: 'Location Type', options: ['Major City', 'Suburban', 'Rural', 'Destination'], default: 'Suburban' },
    },
    outputsSchema: {
      venue: { type: 'text', label: 'Venue Budget' },
      catering: { type: 'text', label: 'Catering Budget' },
      photography: { type: 'text', label: 'Photography Budget' },
      attire: { type: 'text', label: 'Attire Budget' },
      decor: { type: 'text', label: 'Decorations Budget' },
      other: { type: 'text', label: 'Other Budget' },
    },
    htmlContent: buildWeddingBudgetHTML(topic),
    metaTitle: 'Wedding Budget Planner — How Much Does a Wedding Cost? | TrendForge',
    metaDescription: 'Plan your wedding budget with our free planner. Get detailed cost breakdowns and track spending across all wedding categories.',
    faqs: [
      { question: 'How are budget percentages calculated?', answer: 'Budget allocations are based on industry averages from major wedding industry surveys. Adjustments are made for your location type and guest count. Your priorities may differ — feel free to reallocate.' },
    ],
    affiliateProducts: [
      { name: 'The Knot Wedding Planner', category: 'Wedding', description: 'Wedding planning tools' },
      { name: 'Zola Wedding Registry', category: 'Wedding', description: 'Wedding registry and gifts' },
    ],
    relatedSlugs: ['vacation-budget-calculator', 'home-affordability-calculator', 'budget-planner'],
  }),
  'home': (topic) => ({
    title: 'Energy Cost Calculator',
    slug: 'energy-cost-calculator',
    description: 'Calculate your energy costs and potential savings from solar panels or energy-efficient upgrades. See your monthly and annual energy spending.',
    toolType: 'calculator',
    category: 'home',
    inputsSchema: {
      monthlyKwh: { type: 'number', label: 'Monthly Electricity Usage (kWh)', min: 100, max: 5000, default: 900, step: 50 },
      ratePerKwh: { type: 'number', label: 'Rate per kWh ($)', min: 0.05, max: 0.50, default: 0.14, step: 0.01 },
      solarInterest: { type: 'select', label: 'Interested in Solar?', options: ['No', 'Maybe', 'Yes'], default: 'No' },
    },
    outputsSchema: {
      monthlyCost: { type: 'text', label: 'Monthly Energy Cost' },
      annualCost: { type: 'text', label: 'Annual Energy Cost' },
      solarEstimate: { type: 'text', label: 'Solar Savings Estimate' },
      carbonFootprint: { type: 'text', label: 'Carbon Footprint' },
    },
    htmlContent: buildEnergyCalculatorHTML(topic),
    metaTitle: 'Energy Cost Calculator — Calculate Your Electricity Costs | TrendForge',
    metaDescription: 'Calculate your monthly and annual energy costs. Estimate solar savings and see your carbon footprint.',
    faqs: [
      { question: 'How do I find my monthly kWh usage?', answer: 'Check your electricity bill — it will show your monthly kWh consumption. The US average is about 900 kWh/month for a typical household.' },
    ],
    affiliateProducts: [
      { name: 'Tesla Solar Panels', category: 'Home', description: 'Residential solar installation' },
      { name: 'Sense Energy Monitor', category: 'Home', description: 'Track home energy usage in real-time' },
    ],
    relatedSlugs: ['home-affordability-calculator', 'mortgage-calculator', 'vacation-budget-calculator'],
  }),
};

// Fallback calculator
function defaultCalcSpec(topic: Topic): ToolSpec {
  return {
    title: topic.topic.includes('?') ? topic.topic.replace('?', '') + ' Calculator' : topic.topic + ' Calculator',
    slug: slugify(topic.topic) + '-calculator',
    description: 'A free calculator to help you with: ' + topic.topic,
    toolType: 'calculator',
    category: topic.category,
    inputsSchema: {
      value1: { type: 'number', label: 'Value 1', min: 0, max: 10000, default: 100, step: 1 },
      value2: { type: 'number', label: 'Value 2', min: 0, max: 10000, default: 100, step: 1 },
    },
    outputsSchema: {
      result: { type: 'text', label: 'Result' },
    },
    htmlContent: '<p>Enter your values above to calculate your result.</p>',
    metaTitle: topic.topic + ' | TrendForge',
    metaDescription: 'Free calculator: ' + topic.topic,
    faqs: [{ question: 'How is this calculated?', answer: 'Based on standard formulas and industry data.' }],
    affiliateProducts: [],
    relatedSlugs: [],
  };
}

function generateCalculatorSpec(topic: Topic): ToolSpec {
  // Try to find a matching calculator template
  const catKey = topic.category;
  if (CALCULATORS[catKey]) return CALCULATORS[catKey](topic);
  // Keyword matching
  const lower = topic.topic.toLowerCase();
  if (lower.includes('gaming') || lower.includes('pc') || lower.includes('gpu') || lower.includes('cpu') || lower.includes('fps')) return CALCULATORS['gaming'](topic);
  if (lower.includes('house') || lower.includes('mortgage') || lower.includes('home') || lower.includes('afford')) return CALCULATORS['finance'](topic);
  if (lower.includes('gpa') || lower.includes('sat') || lower.includes('college') || lower.includes('school') || lower.includes('student')) return CALCULATORS['education'](topic);
  if (lower.includes('protein') || lower.includes('calorie') || lower.includes('bmi') || lower.includes('workout') || lower.includes('fitness')) return CALCULATORS['fitness'](topic);
  if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('llm')) return CALCULATORS['ai'](topic);
  if (lower.includes('salary') || lower.includes('job') || lower.includes('career')) return CALCULATORS['career'](topic);
  if (lower.includes('travel') || lower.includes('vacation') || lower.includes('trip') || lower.includes('flight')) return CALCULATORS['travel'](topic);
  if (lower.includes('laptop') || lower.includes('best') || lower.includes('buy') || lower.includes('shop')) return CALCULATORS['shopping'](topic);
  if (lower.includes('wedding') || lower.includes('lifestyle')) return CALCULATORS['lifestyle'](topic);
  if (lower.includes('energy') || lower.includes('electric') || lower.includes('solar') || lower.includes('home')) return CALCULATORS['home'](topic);
  return defaultCalcSpec(topic);
}

function generateComparisonSpec(topic: Topic): ToolSpec {
  const base = generateCalculatorSpec(topic);
  return { ...base, toolType: 'comparison' };
}
function generateRecommendationSpec(topic: Topic): ToolSpec {
  const base = generateCalculatorSpec(topic);
  return { ...base, toolType: 'recommendation' };
}
function generateEstimatorSpec(topic: Topic): ToolSpec {
  const base = generateCalculatorSpec(topic);
  return { ...base, toolType: 'estimator' };
}
function generatePlannerSpec(topic: Topic): ToolSpec {
  const base = generateCalculatorSpec(topic);
  return { ...base, toolType: 'planner' };
}
function generateConverterSpec(topic: Topic): ToolSpec {
  const base = generateCalculatorSpec(topic);
  return { ...base, toolType: 'converter' };
}
function generateQuizSpec(topic: Topic): ToolSpec {
  const base = generateCalculatorSpec(topic);
  return { ...base, toolType: 'quiz' };
}
function generateGeneratorSpec(topic: Topic): ToolSpec {
  const base = generateCalculatorSpec(topic);
  return { ...base, toolType: 'generator' };
}
function generateSimulatorSpec(topic: Topic): ToolSpec {
  const base = generateCalculatorSpec(topic);
  return { ...base, toolType: 'simulator' };
}
function generateTrackerSpec(topic: Topic): ToolSpec {
  const base = generateCalculatorSpec(topic);
  return { ...base, toolType: 'tracker' };
}

// ============================================
// HTML Content Builders
// ============================================

function buildGamingPCCalculatorHTML(topic: Topic): string {
  return `
<section class="tool-section">
  <h2>How This Calculator Works</h2>
  <p>Our Gaming PC Budget Calculator analyzes your budget and gaming preferences to recommend the optimal component combination. We consider current market pricing, performance benchmarks, and compatibility to build you the best gaming PC for your money.</p>
  <p>Enter your budget, target resolution, desired FPS, and your main games above. The calculator will recommend a CPU, GPU, RAM, and storage configuration that meets your needs.</p>
</section>
<section class="tool-section">
  <h2>Understanding the Recommendations</h2>
  <p>Component recommendations are based on:</p>
  <ul>
    <li><strong>Performance benchmarks</strong> — Real-world FPS data across popular games</li>
    <li><strong>Current pricing</strong> — Market average prices from major retailers</li>
    <li><strong>Bottleneck analysis</strong> — Ensuring balanced component pairing</li>
    <li><strong>Value optimization</strong> — Best performance per dollar at your budget level</li>
  </ul>
</section>
<section class="tool-section">
  <h2>Methodology</h2>
  <p>Prices are estimated averages and may vary by retailer and region. FPS estimates are based on aggregated benchmark data. This tool provides guidance — always check current prices and reviews before purchasing.</p>
</section>`;
}

function buildMortgageCalculatorHTML(topic: Topic): string {
  return `
<section class="tool-section">
  <h2>How This Calculator Works</h2>
  <p>This home affordability calculator uses the standard <strong>28/36 rule</strong> used by most lenders:</p>
  <ul>
    <li><strong>28%</strong> — Your housing costs should not exceed 28% of gross monthly income</li>
    <li><strong>36%</strong> — Total debt payments should not exceed 36% of gross monthly income</li>
  </ul>
  <p>Enter your income, existing debts, down payment amount, and preferred interest rate. The calculator estimates the maximum home price you can likely qualify for.</p>
</section>
<section class="tool-section">
  <h2>Important Disclaimers</h2>
  <p><em>This calculator provides estimates for educational purposes only. It is not financial advice.</em></p>
  <p>Actual loan approval depends on many factors including credit score, employment history, down payment amount, and specific lender criteria. Property taxes, insurance, HOA fees, and PMI are not included in this estimate and will increase your actual monthly payment.</p>
  <p>Always consult with a qualified mortgage professional before making home buying decisions.</p>
</section>
<section class="tool-section">
  <h2>Tips for Home Buyers</h2>
  <ul>
    <li>Get pre-approved before house hunting</li>
    <li>Keep an emergency fund beyond your down payment</li>
    <li>Consider all costs: taxes, insurance, maintenance, and HOA fees</li>
    <li>Lock in your rate when the market is favorable</li>
    <li>Aim for a down payment of 20% to avoid PMI</li>
  </ul>
</section>`;
}

function buildGPACalculatorHTML(topic: Topic): string {
  return `
<section class="tool-section">
  <h2>How GPA is Calculated</h2>
  <p>Your Grade Point Average (GPA) is calculated by:</p>
  <ol>
    <li>Converting each letter grade to quality points (A=4.0, B=3.0, C=2.0, D=1.0, F=0)</li>
    <li>Multiplying quality points by course credit hours</li>
    <li>Summing all quality points and dividing by total credit hours</li>
  </ol>
  <p><strong>GPA = Σ (Grade Points × Credits) / Σ Credits</strong></p>
</section>
<section class="tool-section">
  <h2>GPA Scale Reference</h2>
  <table class="w-full text-sm">
    <thead><tr><th>Letter Grade</th><th>GPA Points</th><th>Percentage</th></tr></thead>
    <tbody>
      <tr><td>A+</td><td>4.0</td><td>97-100%</td></tr>
      <tr><td>A</td><td>4.0</td><td>93-96%</td></tr>
      <tr><td>A-</td><td>3.7</td><td>90-92%</td></tr>
      <tr><td>B+</td><td>3.3</td><td>87-89%</td></tr>
      <tr><td>B</td><td>3.0</td><td>83-86%</td></tr>
      <tr><td>B-</td><td>2.7</td><td>80-82%</td></tr>
      <tr><td>C+</td><td>2.3</td><td>77-79%</td></tr>
      <tr><td>C</td><td>2.0</td><td>73-76%</td></tr>
      <tr><td>C-</td><td>1.7</td><td>70-72%</td></tr>
      <tr><td>D</td><td>1.0</td><td>60-69%</td></tr>
      <tr><td>F</td><td>0.0</td><td>Below 60%</td></tr>
    </tbody>
  </table>
</section>`;
}

function buildProteinCalculatorHTML(topic: Topic): string {
  return `
<section class="tool-section">
  <h2>How Much Protein Do You Need?</h2>
  <p>Protein requirements depend on your body weight, activity level, and fitness goals. The calculator uses evidence-based guidelines from sports nutrition research.</p>
</section>
<section class="tool-section">
  <h2>General Guidelines</h2>
  <ul>
    <li><strong>Sedentary adults:</strong> 0.8g per kg of body weight</li>
    <li><strong>Active individuals:</strong> 1.2-1.6g per kg</li>
    <li><strong>Muscle building:</strong> 1.6-2.2g per kg</li>
    <li><strong>Athletes:</strong> 1.4-2.0g per kg</li>
  </ul>
  <p>These are general guidelines. Individual needs may vary. Consult a registered dietitian for personalized advice.</p>
</section>
<section class="tool-section">
  <h2>Sources of Protein</h2>
  <p>Good protein sources include: chicken breast, fish, eggs, Greek yogurt, lean beef, tofu, legumes, and whey protein supplements. Aim for a variety of protein sources throughout the day.</p>
</section>`;
}

function buildAiroiCalculatorHTML(topic: Topic): string {
  return `
<section class="tool-section">
  <h2>Calculating AI ROI</h2>
  <p>This calculator estimates the return on investment from implementing AI tools in your business. It factors in:</p>
  <ul>
    <li><strong>Time savings</strong> — Hours recovered per employee</li>
    <li><strong>Cost reduction</strong> — Reduced need for manual tasks</li>
    <li><strong>Revenue impact</strong> — Improved productivity and output</li>
  </ul>
</section>
<section class="tool-section">
  <h2>Important Note</h2>
  <p><em>These are illustrative estimates. Actual ROI varies significantly based on implementation quality, use case, and organizational factors.</em></p>
  <p>Use this calculator as a starting point for your business case, not as a guarantee of results.</p>
</section>`;
}

function buildSalaryCalculatorHTML(topic: Topic): string {
  return `
<section class="tool-section">
  <h2>Understanding Salary Data</h2>
  <p>Salary estimates are based on aggregated data from multiple compensation sources. These represent typical ranges for the specified role, location, and experience level.</p>
  <p><em>Actual salaries vary significantly by company, industry, individual qualifications, and negotiation. Use these figures as a reference point, not a guarantee.</em></p>
</section>
<section class="tool-section">
  <h2>Tips for Salary Research</h2>
  <ul>
    <li>Research salaries at specific companies, not just industry averages</li>
    <li>Consider total compensation: salary, bonus, equity, benefits</li>
    <li>Factor in cost of living for different locations</li>
    <li>Negotiate based on your skills and the value you bring</li>
  </ul>
</section>`;
}

function buildVacationCalculatorHTML(topic: Topic): string {
  return `
<section class="tool-section">
  <h2>How This Calculator Works</h2>
  <p>This calculator estimates your total vacation cost based on your destination, duration, number of travelers, and travel style. Costs are estimated averages and may vary significantly by season, booking time, and availability.</p>
</section>
<section class="tool-section">
  <h2>Budgeting Tips</h2>
  <ul>
    <li>Book flights 2-3 months in advance for best prices</li>
    <li>Consider shoulder season for lower prices and fewer crowds</li>
    <li>Set aside 10-15% buffer for unexpected expenses</li>
    <li>Use travel credit cards for points and protections</li>
  </ul>
</section>`;
}

function buildLaptopFinderHTML(topic: Topic): string {
  return `
<section class="tool-section">
  <h2>How We Recommend Laptops</h2>
  <p>Our recommendation engine matches your use case, budget, and portability preferences against current market options. We consider performance benchmarks, build quality, user reviews, and value for money.</p>
</section>
<section class="tool-section">
  <h2>Buying Tips</h2>
  <ul>
    <li>Consider your primary use case first — gaming vs. productivity vs. design</li>
    <li>RAM: 16GB minimum for most users, 32GB for heavy workloads</li>
    <li>Storage: 512GB SSD minimum, 1TB recommended</li>
    <li>Battery life: Check real-world reviews, not just manufacturer claims</li>
    <li>Display quality matters more than you think — look for good color accuracy</li>
  </ul>
</section>`;
}

function buildWeddingBudgetHTML(topic: Topic): string {
  return `
<section class="tool-section">
  <h2>Wedding Cost Breakdown</h2>
  <p>Wedding costs vary dramatically by location, guest count, and personal preferences. This planner provides recommended budget allocations based on industry averages.</p>
</section>
<section class="tool-section">
  <h2>Average Wedding Costs (US)</h2>
  <ul>
    <li><strong>Venue:</strong> 30-40% of budget</li>
    <li><strong>Catering:</strong> 20-25% of budget</li>
    <li><strong>Photography/Videography:</strong> 10-12% of budget</li>
    <li><strong>Attire & Beauty:</strong> 8-10% of budget</li>
    <li><strong>Decorations & Flowers:</strong> 8-10% of budget</li>
    <li><strong>Music & Entertainment:</strong> 5-8% of budget</li>
    <li><strong>Other (stationery, favors, etc.):</strong> 5-10% of budget</li>
  </ul>
</section>
<section class="tool-section">
  <h2>Money-Saving Tips</h2>
  <ul>
    <li>Consider off-peak dates (Friday or Sunday, winter months)</li>
    <li>Limit the guest list — it's the #1 cost driver</li>
    <li>DIY what you can, but know when to hire professionals</li>
    <li>Get multiple vendor quotes and negotiate</li>
  </ul>
</section>`;
}

function buildEnergyCalculatorHTML(topic: Topic): string {
  return `
<section class="tool-section">
  <h2>Understanding Your Energy Costs</h2>
  <p>This calculator estimates your monthly and annual electricity costs based on your usage and local rates. It can also estimate potential savings from solar panel installation.</p>
</section>
<section class="tool-section">
  <h2>Reducing Energy Costs</h2>
  <ul>
    <li>Switch to LED bulbs (uses 75% less energy)</li>
    <li>Upgrade to Energy Star appliances</li>
    <li>Improve home insulation</li>
    <li>Use a programmable thermostat</li>
    <li>Consider solar panels for long-term savings</li>
  </ul>
</section>`;
}
