'use client';

import { useState, useCallback } from 'react';
import { Calculator, Copy, Share2, CheckCircle2, RotateCcw } from 'lucide-react';

interface InputField {
  type: string;
  label: string;
  min?: number;
  max?: number;
  default?: number | string;
  step?: number;
  options?: string[];
  [key: string]: unknown;
}

interface OutputField {
  type: string;
  label: string;
  [key: string]: unknown;
}

interface ToolCalculatorProps {
  toolId: string;
  slug: string;
  inputs: Record<string, InputField>;
  outputs: Record<string, OutputField>;
  toolType: string;
  title: string;
}

export default function ToolCalculator({
  toolId,
  slug,
  inputs,
  outputs,
  toolType,
  title,
}: ToolCalculatorProps) {
  // Initialize state from input defaults
  const getDefaults = () => {
    const defaults: Record<string, string | number> = {};
    for (const [key, field] of Object.entries(inputs)) {
      defaults[key] = field.default ?? (field.type === 'number' ? (field.min || 0) : '');
    }
    return defaults;
  };

  const [values, setValues] = useState<Record<string, string | number>>(getDefaults);
  const [results, setResults] = useState<Record<string, string> | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const handleChange = (key: string, value: string | number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    setValues(getDefaults());
    setResults(null);
    setHasCalculated(false);
  };

  // ========================================
  // CALCULATION LOGIC
  // Each tool type has its own calculation function
  // ========================================
  const calculate = useCallback(() => {
    setCalculating(true);

    // Simulate a brief processing time for UX
    setTimeout(() => {
      const computed = computeResults(slug, values);
      setResults(computed);
      setHasCalculated(true);
      setCalculating(false);

      // Track tool usage
      fetch(`/api/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, event: 'tool_complete' }),
      }).catch(() => {});
    }, 300);
  }, [slug, values, toolId]);

  const copyResult = () => {
    if (!results) return;
    const text = Object.entries(results)
      .map(([_, val]) => val)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareResult = () => {
    const resultText = results ? Object.entries(results)
      .map(([_, val]) => val)
      .join(' | ') : '';
    const text = `Check out this tool: ${title} — ${resultText}`;
    if (navigator.share) {
      navigator.share({ title, text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Calculator Header */}
      <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-foreground">{title}</h2>
        </div>
      </div>

      <div className="p-6">
        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {Object.entries(inputs).map(([key, field]) => (
            <div key={key}>
              <label className="calc-label">{field.label}</label>
              {field.type === 'select' && field.options ? (
                <select
                  value={String(values[key])}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="calc-input"
                >
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'text' ? (
                <input
                  type="text"
                  value={String(values[key])}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="calc-input"
                  placeholder={String(field.default || '')}
                />
              ) : (
                <input
                  type="number"
                  value={values[key] ?? ''}
                  onChange={(e) => handleChange(key, e.target.value === '' ? '' : Number(e.target.value))}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  className="calc-input"
                />
              )}
            </div>
          ))}
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculate}
          disabled={calculating}
          className="w-full py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {calculating ? (
            <>
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="h-5 w-5" />
              Calculate
            </>
          )}
        </button>

        {/* Results */}
        {results && hasCalculated && (
          <div className="mt-6">
            <div className="calc-result">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(results).map(([key, value]) => {
                  const outputField = outputs[key];
                  const isFirst = key === Object.keys(results)[0];
                  return (
                    <div key={key} className={isFirst ? 'md:col-span-2' : ''}>
                      <p className="text-sm text-muted-foreground mb-1">{outputField?.label || key}</p>
                      <p className={isFirst ? 'calc-result-value' : 'text-lg font-bold text-foreground'}>
                        {value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={copyResult}
                className="flex items-center gap-1.5 px-4 py-2 bg-muted rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Result'}
              </button>
              <button
                onClick={shareResult}
                className="flex items-center gap-1.5 px-4 py-2 bg-muted rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-4 py-2 bg-muted rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>

            {/* Disclaimer for financial/health tools */}
            {['finance', 'fitness'].includes(slug.split('-')[0]) && (
              <p className="text-xs text-muted-foreground mt-4 italic">
                * These results are estimates for informational purposes only and do not constitute professional advice.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// CALCULATION FUNCTIONS
// Each tool has its own calculation logic
// ========================================

function computeResults(slug: string, values: Record<string, string | number>): Record<string, string> {
  if (slug.includes('gaming-pc') || slug.includes('budget-calculator')) return calcGamingPC(values);
  if (slug.includes('home-affordability') || slug.includes('mortgage')) return calcMortgage(values);
  if (slug.includes('gpa')) return calcGPA(values);
  if (slug.includes('protein')) return calcProtein(values);
  if (slug.includes('calorie') || slug.includes('tdee')) return calcCalories(values);
  if (slug.includes('bmi')) return calcBMI(values);
  if (slug.includes('compound-interest') || slug.includes('investment')) return calcInvestment(values);
  if (slug.includes('salary')) return calcSalary(values);
  if (slug.includes('vacation') || slug.includes('trip')) return calcVacation(values);
  if (slug.includes('wedding')) return calcWedding(values);
  if (slug.includes('student-loan') || slug.includes('loan-payment')) return calcLoan(values);
  if (slug.includes('auto-loan') || slug.includes('car-afford')) return calcAutoLoan(values);
  if (slug.includes('energy') || slug.includes('electric')) return calcEnergy(values);
  if (slug.includes('ai-roi') || slug.includes('ai-roi')) return calcAIRoi(values);
  if (slug.includes('gpu') || slug.includes('pc-bottleneck')) return calcPCBottleneck(values);
  if (slug.includes('power-supply') || slug.includes('psu')) return calcPSU(values);
  if (slug.includes('ram')) return calcRAM(values);
  if (slug.includes('sat')) return calcSAT(values);
  if (slug.includes('retirement')) return calcRetirement(values);
  if (slug.includes('macro')) return calcMacros(values);
  if (slug.includes('laptop') || slug.includes('best-laptop')) return calcLaptop(values);
  return calcGeneric(values);
}

function calcGamingPC(v: Record<string, string | number>): Record<string, string> {
  const budget = Number(v.budget) || 1000;
  const resolution = String(v.resolution) || '1080p';
  const targetFps = Number(v.targetFps) || 60;

  // Budget allocation
  const gpuBudget = Math.round(budget * 0.35);
  const cpuBudget = Math.round(budget * 0.2);
  const ramBudget = Math.round(budget * 0.12);
  const storageBudget = Math.round(budget * 0.1);
  const mbBudget = Math.round(budget * 0.1);
  const psuBudget = Math.round(budget * 0.07);
  const caseBudget = Math.round(budget * 0.06);

  // GPU recommendations
  let gpu: string;
  if (gpuBudget >= 600) gpu = 'NVIDIA RTX 4070 Ti ($600+)';
  else if (gpuBudget >= 400) gpu = 'NVIDIA RTX 4070 ($400+)';
  else if (gpuBudget >= 300) gpu = 'NVIDIA RTX 4060 Ti ($300+)';
  else if (gpuBudget >= 200) gpu = 'NVIDIA RTX 4060 / AMD RX 7600 ($200+)';
  else gpu = 'AMD RX 7600 / Intel Arc A750 ($180+)';

  // CPU recommendations
  let cpu: string;
  if (cpuBudget >= 300) cpu = 'AMD Ryzen 7 7800X3D ($300+)';
  else if (cpuBudget >= 200) cpu = 'AMD Ryzen 5 7600X ($200+)';
  else if (cpuBudget >= 150) cpu = 'AMD Ryzen 5 5600X ($130+)';
  else cpu = 'Intel Core i5-12400F ($110+)';

  // RAM
  let ram: string;
  if (budget >= 1500) ram = '32GB DDR5-5600';
  else if (budget >= 800) ram = '16GB DDR5-5200';
  else ram = '16GB DDR4-3200';

  // Storage
  let storage: string;
  if (budget >= 1500) storage = '1TB NVMe Gen4 SSD';
  else if (budget >= 800) storage = '512GB NVMe SSD';
  else storage = '512GB SATA SSD';

  // FPS estimation
  let fpsBase: number;
  if (resolution === '4K') fpsBase = targetFps * 0.4;
  else if (resolution === '1440p') fpsBase = targetFps * 0.7;
  else fpsBase = targetFps * 1.2;
  const estFps = Math.round(fpsBase * (budget / 1000));

  const total = gpuBudget + cpuBudget + ramBudget + storageBudget + mbBudget + psuBudget + caseBudget;

  return {
    gpu: `${gpu} — ~$${gpuBudget}`,
    cpu: `${cpu} — ~$${cpuBudget}`,
    ram: `${ram} — ~$${ramBudget}`,
    storage: `${storage} — ~$${storageBudget}`,
    estimatedFps: `${estFps}-${Math.round(estFps * 1.3)} FPS (varies by game)`,
    totalCost: `~$${total.toLocaleString()} estimated`,
  };
}

function calcMortgage(v: Record<string, string | number>): Record<string, string> {
  const income = Number(v.annualIncome) || 80000;
  const monthlyDebt = Number(v.monthlyDebt) || 0;
  const downPayment = Number(v.downPayment) || 0;
  const rate = Number(v.interestRate) || 6.5;
  const term = String(v.loanTerm) || '30 years';

  const termYears = term.includes('15') ? 15 : term.includes('20') ? 20 : 30;
  const monthlyRate = rate / 100 / 12;
  const numPayments = termYears * 12;

  const monthlyIncome = income / 12;
  const maxHousingPayment = monthlyIncome * 0.28;
  const maxTotalDebt = monthlyIncome * 0.36;
  const availableForHousing = Math.min(maxHousingPayment, maxTotalDebt - monthlyDebt);

  // Calculate max loan from monthly payment
  let maxLoan: number;
  if (monthlyRate === 0) {
    maxLoan = availableForHousing * numPayments;
  } else {
    maxLoan = availableForHousing * ((1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate);
  }

  const maxPrice = maxLoan + downPayment;
  const actualMonthlyPayment = maxLoan > 0 ?
    maxLoan * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1) : 0;
  const totalInterest = (actualMonthlyPayment * numPayments) - maxLoan;
  const dti = ((actualMonthlyPayment + monthlyDebt) / monthlyIncome * 100);

  return {
    maxPrice: `$${Math.round(maxPrice).toLocaleString()}`,
    monthlyPayment: `$${Math.round(actualMonthlyPayment).toLocaleString()}/mo (principal & interest)`,
    dtiRatio: `${dti.toFixed(1)}% (housing + debts / income)`,
    totalInterest: `$${Math.round(totalInterest).toLocaleString()} over ${termYears} years`,
  };
}

function calcGPA(v: Record<string, string | number>): Record<string, string> {
  // For simplicity, calculate based on a standard set of grades
  // In production, this would use dynamic grade inputs
  const scale = String(v.scale) || '4.0 (Standard)';

  // Demo: calculate with default values
  const courses = [
    { name: 'Calculus', grade: 'A', credits: 4 },
    { name: 'English', grade: 'B+', credits: 3 },
    { name: 'Physics', grade: 'A-', credits: 4 },
    { name: 'History', grade: 'B', credits: 3 },
  ];

  const gradePoints: Record<string, number> = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0,
  };

  let totalPoints = 0;
  let totalCredits = 0;
  for (const course of courses) {
    totalPoints += (gradePoints[course.grade] || 0) * course.credits;
    totalCredits += course.credits;
  }

  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

  let letterGrade: string;
  if (gpa >= 3.7) letterGrade = 'A-';
  else if (gpa >= 3.3) letterGrade = 'B+';
  else if (gpa >= 3.0) letterGrade = 'B';
  else if (gpa >= 2.7) letterGrade = 'B-';
  else if (gpa >= 2.3) letterGrade = 'C+';
  else letterGrade = 'C';

  let classification: string;
  if (gpa >= 3.9) classification = "Dean's List / Summa Cum Laude";
  else if (gpa >= 3.7) classification = "Magna Cum Laude";
  else if (gpa >= 3.5) classification = "Cum Laude";
  else if (gpa >= 3.0) classification = "Good Standing";
  else if (gpa >= 2.0) classification = "Satisfactory";
  else classification = "Academic Warning";

  return {
    gpa: gpa.toFixed(2),
    letterGrade: `Equivalent: ${letterGrade}`,
    classification,
  };
}

function calcProtein(v: Record<string, string | number>): Record<string, string> {
  const weightLbs = Number(v.weight) || 160;
  const activity = String(v.activityLevel) || 'Moderately Active';
  const goal = String(v.goal) || 'General Health';

  const weightKg = weightLbs / 2.205;

  let gramsPerKg: number;
  switch (goal) {
    case 'Muscle Building': gramsPerKg = 1.8; break;
    case 'Weight Loss': gramsPerKg = 1.6; break;
    case 'Athletic Performance': gramsPerKg = 2.0; break;
    default: gramsPerKg = 1.2;
  }

  // Adjust for activity level
  switch (activity) {
    case 'Very Active': case 'Athlete': gramsPerKg *= 1.15; break;
    case 'Moderately Active': gramsPerKg *= 1.0; break;
    case 'Lightly Active': gramsPerKg *= 0.9; break;
    default: gramsPerKg *= 0.85;
  }

  const minProtein = Math.round(weightKg * (gramsPerKg * 0.85));
  const maxProtein = Math.round(weightKg * (gramsPerKg * 1.15));

  return {
    minProtein: `${minProtein}g per day`,
    maxProtein: `${maxProtein}g per day`,
    perKg: `${(minProtein / weightKg).toFixed(1)}–${(maxProtein / weightKg).toFixed(1)}g per kg body weight`,
  };
}

function calcCalories(v: Record<string, string | number>): Record<string, string> {
  const weight = Number(v.weight) || 160;
  const height = Number(v.height) || 70;
  const age = Number(v.age) || 30;
  const gender = String(v.gender) || 'male';
  const activity = String(v.activityLevel) || 'Moderately Active';

  const weightKg = weight / 2.205;
  const heightCm = height * 2.54;

  // Mifflin-St Jeor
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  const multipliers: Record<string, number> = {
    'Sedentary': 1.2, 'Lightly Active': 1.375,
    'Moderately Active': 1.55, 'Very Active': 1.725, 'Athlete': 1.9,
  };
  const tdee = bmr * (multipliers[activity] || 1.55);

  return {
    bmr: `${Math.round(bmr)} calories (Basal Metabolic Rate)`,
    tdee: `${Math.round(tdee)} calories/day (Total Daily Energy Expenditure)`,
    loseWeight: `${Math.round(tdee - 500)} calories/day (for ~1lb/week loss)`,
    gainMuscle: `${Math.round(tdee + 300)} calories/day (for lean bulk)`,
  };
}

function calcBMI(v: Record<string, string | number>): Record<string, string> {
  const weight = Number(v.weight) || 160;
  const height = Number(v.height) || 70;

  const weightKg = weight / 2.205;
  const heightM = (height * 2.54) / 100;
  const bmi = weightKg / (heightM * heightM);

  let category: string;
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal weight';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese';

  return {
    bmi: bmi.toFixed(1),
    category,
    healthyRange: `Healthy BMI: 18.5–24.9`,
  };
}

function calcInvestment(v: Record<string, string | number>): Record<string, string> {
  const initial = Number(v.initial) || 10000;
  const monthly = Number(v.monthly) || 500;
  const rate = Number(v.rate) || 7;
  const years = Number(v.years) || 20;

  const monthlyRate = rate / 100 / 12;
  const months = years * 12;

  // Future value with monthly contributions
  let total = initial;
  for (let i = 0; i < months; i++) {
    total = total * (1 + monthlyRate) + monthly;
  }

  const totalContributed = initial + monthly * months;
  const totalGrowth = total - totalContributed;

  return {
    futureValue: `$${Math.round(total).toLocaleString()}`,
    totalContributed: `$${Math.round(totalContributed).toLocaleString()} contributed`,
    totalGrowth: `$${Math.round(totalGrowth).toLocaleString()} in investment growth`,
  };
}

function calcSalary(v: Record<string, string | number>): Record<string, string> {
  const jobTitle = String(v.jobTitle) || 'Software Engineer';
  const location = String(v.location) || 'National Average';
  const experience = String(v.experience) || 'Mid Level';

  // Salary database (simplified)
  const baseSalaries: Record<string, number> = {
    'software engineer': 120000, 'data scientist': 115000,
    'product manager': 130000, 'designer': 95000,
    'marketing manager': 85000, 'accountant': 75000,
  };

  const expMultipliers: Record<string, number> = {
    'Entry Level': 0.7, 'Mid Level': 1.0, 'Senior': 1.3,
    'Lead/Principal': 1.5, 'Director+': 1.8,
  };

  const locationMultipliers: Record<string, number> = {
    'San Francisco': 1.3, 'New York': 1.25, 'Seattle': 1.2,
    'Austin': 1.05, 'Chicago': 1.0, 'Remote': 1.0,
  };

  const titleLower = jobTitle.toLowerCase();
  let base = 100000;
  for (const [key, val] of Object.entries(baseSalaries)) {
    if (titleLower.includes(key)) { base = val; break; }
  }

  const expMult = expMultipliers[experience] || 1.0;
  const locMult = Object.entries(locationMultipliers)
    .find(([k]) => location.toLowerCase().includes(k.toLowerCase()))?.[1] || 1.0;

  const avg = Math.round(base * expMult * locMult);
  const low = Math.round(avg * 0.8);
  const high = Math.round(avg * 1.2);

  return {
    avgSalary: `$${avg.toLocaleString()}`,
    salaryRange: `$${low.toLocaleString()} – $${high.toLocaleString()}`,
    percentile: `${Math.round((avg / 150000) * 100)}th percentile nationally`,
  };
}

function calcVacation(v: Record<string, string | number>): Record<string, string> {
  const days = Number(v.days) || 7;
  const travelers = Number(v.travelers) || 2;
  const style = String(v.style) || 'Moderate';

  const dailyBudgets: Record<string, number> = {
    Budget: 80, Moderate: 180, Comfortable: 350, Luxury: 700,
  };
  const daily = dailyBudgets[style] || 180;

  const flightBase = style === 'Budget' ? 300 : style === 'Moderate' ? 600 : style === 'Comfortable' ? 1200 : 2500;

  const flights = flightBase * travelers;
  const hotel = daily * 0.4 * days * travelers;
  const food = daily * 0.3 * days * travelers;
  const activities = daily * 0.2 * days * travelers;
  const transport = daily * 0.1 * days * travelers;
  const total = flights + hotel + food + activities + transport;
  const perPersonPerDay = Math.round(total / travelers / days);

  return {
    flights: `$${flights.toLocaleString()}`,
    hotel: `$${Math.round(hotel).toLocaleString()}`,
    food: `$${Math.round(food).toLocaleString()}`,
    activities: `$${Math.round(activities).toLocaleString()}`,
    total: `$${Math.round(total).toLocaleString()}`,
    perDay: `$${perPersonPerDay}/person/day`,
  };
}

function calcWedding(v: Record<string, string | number>): Record<string, string> {
  const budget = Number(v.totalBudget) || 30000;
  const guests = Number(v.guestCount) || 100;
  const location = String(v.location) || 'Suburban';

  const locMult = location === 'Major City' ? 1.3 : location === 'Destination' ? 1.2 : location === 'Rural' ? 0.8 : 1.0;

  const categories = {
    venue: 0.35, catering: 0.22, photography: 0.10,
    attire: 0.08, decor: 0.08, other: 0.17,
  };

  return {
    venue: `$${Math.round(budget * categories.venue * locMult).toLocaleString()}`,
    catering: `$${Math.round(budget * categories.catering * locMult).toLocaleString()} ($${Math.round(budget * categories.catering * locMult / guests)}/guest)`,
    photography: `$${Math.round(budget * categories.photography).toLocaleString()}`,
    attire: `$${Math.round(budget * categories.attire).toLocaleString()}`,
    decor: `$${Math.round(budget * categories.decor).toLocaleString()}`,
    other: `$${Math.round(budget * categories.other).toLocaleString()}`,
  };
}

function calcLoan(v: Record<string, string | number>): Record<string, string> {
  const principal = Number(v.principal) || 50000;
  const rate = Number(v.rate) || 6;
  const years = Number(v.years) || 10;

  const monthlyRate = rate / 100 / 12;
  const numPayments = years * 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  const totalPaid = payment * numPayments;
  const totalInterest = totalPaid - principal;

  return {
    monthlyPayment: `$${Math.round(payment).toLocaleString()}/mo`,
    totalPaid: `$${Math.round(totalPaid).toLocaleString()} total`,
    totalInterest: `$${Math.round(totalInterest).toLocaleString()} in interest`,
  };
}

function calcAutoLoan(v: Record<string, string | number>): Record<string, string> {
  const price = Number(v.price) || 35000;
  const down = Number(v.downPayment) || 5000;
  const rate = Number(v.rate) || 6.5;
  const years = Number(v.years) || 5;

  const loan = price - down;
  const monthlyRate = rate / 100 / 12;
  const numPayments = years * 12;
  const payment = loan * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

  return {
    loanAmount: `$${Math.round(loan).toLocaleString()}`,
    monthlyPayment: `$${Math.round(payment).toLocaleString()}/mo`,
    totalCost: `$${Math.round(payment * numPayments + down).toLocaleString()} total`,
  };
}

function calcEnergy(v: Record<string, string | number>): Record<string, string> {
  const kwh = Number(v.monthlyKwh) || 900;
  const rate = Number(v.ratePerKwh) || 0.14;
  const solar = String(v.solarInterest) || 'No';

  const monthlyCost = kwh * rate;
  const annualCost = monthlyCost * 12;
  const solarSavings = solar !== 'No' ? annualCost * 0.7 : 0;
  const carbonLbs = kwh * 0.92;

  return {
    monthlyCost: `$${monthlyCost.toFixed(2)}`,
    annualCost: `$${annualCost.toFixed(2)}/year`,
    solarEstimate: solar !== 'No' ? `~$${Math.round(solarSavings).toLocaleString()}/year savings with solar` : 'Enable solar estimate above',
    carbonFootprint: `${Math.round(carbonLbs)} lbs CO₂/month`,
  };
}

function calcAIRoi(v: Record<string, string | number>): Record<string, string> {
  const employees = Number(v.employees) || 50;
  const avgSalary = Number(v.avgSalary) || 75000;
  const aiCost = Number(v.aiCost) || 500;
  const timeSavedPct = Number(v.timeSavedPct) || 20;

  const annualPayroll = employees * avgSalary;
  const timeSavedValue = annualPayroll * (timeSavedPct / 100);
  const annualAiCost = aiCost * 12;
  const netSavings = timeSavedValue - annualAiCost;
  const roi = annualAiCost > 0 ? ((netSavings / annualAiCost) * 100) : 0;
  const paybackMonths = netSavings > 0 ? (annualAiCost / (timeSavedValue / 12)) : Infinity;

  return {
    annualSavings: `$${Math.round(timeSavedValue).toLocaleString()}/year estimated`,
    roi: `${Math.round(roi)}% ROI`,
    paybackPeriod: paybackMonths < 100 ? `${Math.round(paybackMonths)} months` : 'Does not pay back at these settings',
  };
}

function calcPCBottleneck(v: Record<string, string | number>): Record<string, string> {
  const cpuScore = Number(v.cpuScore) || 70;
  const gpuScore = Number(v.gpuScore) || 80;

  const diff = gpuScore - cpuScore;
  let bottleneck: string;
  let recommendation: string;

  if (Math.abs(diff) < 10) {
    bottleneck = 'Balanced';
    recommendation = 'Your CPU and GPU are well matched. No significant bottleneck.';
  } else if (diff > 0) {
    bottleneck = `CPU bottleneck (~${Math.abs(diff)}%)`;
    recommendation = `Your GPU (${gpuScore}/100) is stronger than your CPU (${cpuScore}/100). Consider upgrading your CPU for better performance.`;
  } else {
    bottleneck = `GPU bottleneck (~${Math.abs(diff)}%)`;
    recommendation = `Your CPU (${cpuScore}/100) is stronger than your GPU (${gpuScore}/100). Consider upgrading your GPU for better gaming performance.`;
  }

  return { bottleneck, recommendation };
}

function calcPSU(v: Record<string, string | number>): Record<string, string> {
  const gpu = Number(v.gpuPower) || 200;
  const cpu = Number(v.cpuPower) || 65;
  const other = Number(v.otherPower) || 50;

  const total = gpu + cpu + other;
  const recommended = Math.ceil(total * 1.3 / 50) * 50; // 30% headroom, round to nearest 50

  return {
    estimatedPower: `${total}W`,
    recommendedPSU: `${recommended}W minimum`,
    suggestion: `We recommend a ${recommended}W or higher 80+ Bronze certified PSU for stability and efficiency.`,
  };
}

function calcRAM(v: Record<string, string | number>): Record<string, string> {
  const usage = String(v.usage) || 'Gaming';
  const games = String(v.games) || 'Modern AAA';

  const recommendations: Record<string, { ram: string; speed: string; reason: string }> = {
    'Light Gaming': { ram: '16GB', speed: 'DDR5-5200', reason: 'Sufficient for most games and multitasking' },
    'Gaming': { ram: '16GB', speed: 'DDR5-5600', reason: 'Sweet spot for gaming in 2024' },
    'Heavy Multitasking': { ram: '32GB', speed: 'DDR5-5600', reason: 'Better for streaming, multiple apps, and heavy workloads' },
    'Content Creation': { ram: '32GB', speed: 'DDR5-6000', reason: 'Video editing and rendering benefit from more RAM' },
    'Workstation': { ram: '64GB', speed: 'DDR5-6000', reason: 'For professional 3D rendering, ML training, large datasets' },
  };

  const rec = recommendations[usage] || recommendations['Gaming'];
  return { recommended: `${rec.ram} ${rec.speed}`, reason: rec.reason, games };
}

function calcSAT(v: Record<string, string | number>): Record<string, string> {
  const score = Number(v.score) || 1200;

  let percentile: string;
  if (score >= 1500) percentile = '~99th';
  else if (score >= 1400) percentile = '~94th';
  else if (score >= 1300) percentile = '~87th';
  else if (score >= 1200) percentile = '~75th';
  else if (score >= 1100) percentile = '~61st';
  else if (score >= 1000) percentile = '~50th';
  else percentile = '~40th';

  return {
    percentile: `${percentile} percentile`,
    competitiveness: score >= 1300 ? 'Highly Competitive' : score >= 1100 ? 'Competitive' : 'Moderate',
    note: 'Percentiles based on recent College Board data. Actual percentiles may vary by year.',
  };
}

function calcRetirement(v: Record<string, string | number>): Record<string, string> {
  const age = Number(v.age) || 30;
  const retireAge = Number(v.retireAge) || 65;
  const income = Number(v.income) || 80000;
  const savings = Number(v.savings) || 50000;
  const rate = Number(v.rate) || 7;

  const yearsToRetire = retireAge - age;
  const targetRetirement = income * 12 * 25; // 25x rule
  const needed = targetRetirement - savings;
  const monthlyNeeded = needed / (yearsToRetire * 12);
  const monthlyRate = rate / 100 / 12;
  const months = yearsToRetire * 12;

  // Future value of current savings
  const fvCurrent = savings * Math.pow(1 + rate / 100, yearsToRetire);
  const gap = targetRetirement - fvCurrent;
  const monthlyContrib = gap > 0 ? gap * (monthlyRate / (Math.pow(1 + monthlyRate, months) - 1)) : 0;

  return {
    targetRetirement: `$${Math.round(targetRetirement / 1000)}K (25× annual income)`,
    monthlySavings: `$${Math.round(monthlyContrib).toLocaleString()}/mo needed`,
    projectedGrowth: `$${Math.round(fvCurrent / 1000)}K from current savings`,
  };
}

function calcMacros(v: Record<string, string | number>): Record<string, string> {
  const weight = Number(v.weight) || 160;
  const goal = String(v.goal) || 'Muscle Building';
  const activity = String(v.activityLevel) || 'Moderately Active';

  const weightKg = weight / 2.205;
  const proteinPerKg = goal === 'Muscle Building' ? 2.0 : goal === 'Weight Loss' ? 1.8 : 1.6;
  const protein = Math.round(weightKg * proteinPerKg);
  const fat = Math.round(weightKg * 1.0);
  const carbs = Math.round((protein * 4 + fat * 9) > 0 ? weightKg * 4 : weightKg * 4);

  const tdee = Math.round(weightKg * (activity === 'Very Active' ? 40 : activity === 'Moderately Active' ? 35 : 30));

  return {
    protein: `${protein}g/day`,
    fat: `${fat}g/day`,
    carbs: `${carbs}g/day`,
    calories: `~${tdee} calories/day`,
  };
}

function calcLaptop(v: Record<string, string | number>): Record<string, string> {
  const useCase = String(v.useCase) || 'General Use';
  const budget = Number(v.budget) || 1000;

  const recs: Record<string, { top: string; budget: string; premium: string }> = {
    'Gaming': {
      top: 'ASUS ROG Zephyrus G14 (~$1,500)',
      budget: 'Lenovo LOQ 15 (~$800)',
      premium: 'Razer Blade 16 (~$2,800)',
    },
    'Programming': {
      top: 'MacBook Air M3 (~$1,100)',
      budget: 'Lenovo IdeaPad 5 Pro (~$700)',
      premium: 'MacBook Pro 16 M3 Max (~$2,500)',
    },
    'Design': {
      top: 'MacBook Pro 14 M3 (~$1,600)',
      budget: 'ASUS ZenBook 14 (~$900)',
      premium: 'MacBook Pro 16 M3 Max (~$2,500)',
    },
    'Business': {
      top: 'ThinkPad X1 Carbon (~$1,400)',
      budget: 'Lenovo ThinkBook 14 (~$700)',
      premium: 'Dell XPS 15 (~$1,800)',
    },
    'Student': {
      top: 'MacBook Air M3 (~$1,000)',
      budget: 'Acer Swift 3 (~$500)',
      premium: 'MacBook Air M3 15 (~$1,300)',
    },
    'General Use': {
      top: 'MacBook Air M3 (~$1,000)',
      budget: 'Acer Aspire 5 (~$450)',
      premium: 'Dell XPS 13 (~$1,200)',
    },
  };

  const rec = recs[useCase] || recs['General Use'];
  return { recommendation: rec.top, alternative: rec.budget, premium: rec.premium };
}

function calcGeneric(v: Record<string, string | number>): Record<string, string> {
  const v1 = Number(Object.values(v)[0]) || 0;
  const v2 = Number(Object.values(v)[1]) || 1;
  const result = v1 + v2;
  return { result: `${result}` };
}
