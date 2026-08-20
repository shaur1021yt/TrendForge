export interface OpportunityScore {
  score: number;
  demand: number;
  growth: number;
  commercialIntent: number;
  toolPotential: number;
  competition: number;
  label: string;
  emoji: string;
  decision: 'BUILD' | 'SKIP' | 'REVIEW';
  reason: string;
}

/**
 * Calculate opportunity score for a topic.
 * Formula: (demand * growth * commercialIntent * toolPotential) / (competition + 1) normalized to 0-100
 */
export function calculateOpportunityScore(params: {
  demand: number;
  growth: number;
  commercialIntent: number;
  toolPotential: number;
  competition: number;
}): OpportunityScore {
  const { demand, growth, commercialIntent, toolPotential, competition } = params;

  // Clamp all inputs to 0-100
  const d = Math.max(0, Math.min(100, demand));
  const g = Math.max(0, Math.min(100, growth));
  const c = Math.max(0, Math.min(100, commercialIntent));
  const t = Math.max(0, Math.min(100, toolPotential));
  const comp = Math.max(1, Math.min(100, competition));

  // Weighted formula: higher demand, growth, commercial intent, and tool potential are good
  // Higher competition reduces score
  const raw = (d * g * c * t) / (comp * comp);
  
  // Normalize to 0-100 using logarithmic scaling
  const maxRaw = (100 * 100 * 100 * 100) / (1 * 1);
  const normalized = Math.min(100, Math.max(0, (Math.log(raw + 1) / Math.log(maxRaw + 1)) * 100));

  const score = Math.round(normalized);

  let label: string;
  let emoji: string;
  let decision: 'BUILD' | 'SKIP' | 'REVIEW';
  let reason: string;

  if (score >= 85) {
    emoji = '🔥';
    label = 'Excellent opportunity';
    decision = 'BUILD';
    reason = `High demand (${d}/100), strong growth (${g}/100), excellent commercial intent (${c}/100), and high tool potential (${t}/100) with manageable competition (${comp}/100).`;
  } else if (score >= 70) {
    emoji = '⭐';
    label = 'Great opportunity';
    decision = 'BUILD';
    reason = `Solid metrics across demand (${d}/100), growth (${g}/100), and tool potential (${t}/100). Worth building.`;
  } else if (score >= 55) {
    emoji = '👍';
    label = 'Good opportunity';
    decision = 'REVIEW';
    reason = `Decent opportunity but may need refinement. Demand: ${d}/100, Competition: ${comp}/100.`;
  } else if (score >= 35) {
    emoji = '🤔';
    label = 'Moderate opportunity';
    decision = 'REVIEW';
    reason = `Mixed signals. May be worth monitoring for trend changes before committing resources.`;
  } else {
    emoji = '❄️';
    label = 'Low opportunity';
    decision = 'SKIP';
    reason = `Insufficient demand or too much competition for a worthwhile investment.`;
  }

  return {
    score,
    demand: d,
    growth: g,
    commercialIntent: c,
    toolPotential: t,
    competition: comp,
    label,
    emoji,
    decision,
    reason,
  };
}

/**
 * Determine the best tool type for a given topic
 */
export function suggestToolType(topic: string): string {
  const lower = topic.toLowerCase();

  if (lower.includes('cost') || lower.includes('how much') || lower.includes('price') || lower.includes('afford')) {
    return 'calculator';
  }
  if (lower.includes('best') || lower.includes('top') || lower.includes('vs') || lower.includes('compare') || lower.includes('comparison')) {
    return 'comparison';
  }
  if (lower.includes('what') || lower.includes('which') || lower.includes('should i')) {
    return 'recommendation';
  }
  if (lower.includes('convert') || lower.includes('unit') || lower.includes('formula')) {
    return 'converter';
  }
  if (lower.includes('plan') || lower.includes('schedule') || lower.includes('budget')) {
    return 'planner';
  }
  if (lower.includes('estimate') || lower.includes('predict') || lower.includes('will')) {
    return 'estimator';
  }
  if (lower.includes('simulat') || lower.includes('scenario')) {
    return 'simulator';
  }
  if (lower.includes('track') || lower.includes('monitor')) {
    return 'tracker';
  }
  if (lower.includes('quiz') || lower.includes('test') || lower.includes('score')) {
    return 'quiz';
  }
  if (lower.includes('generat') || lower.includes('create') || lower.includes('build')) {
    return 'generator';
  }
  return 'calculator';
}

/**
 * Determine the best category for a topic
 */
export function suggestCategory(topic: string): string {
  const lower = topic.toLowerCase();
  const categoryKeywords: Record<string, string[]> = {
    gaming: ['game', 'gaming', 'fps', 'minecraft', 'pc build', 'gpu', 'cpu', 'shader', 'steam', 'playstation', 'xbox', 'nintendo'],
    technology: ['computer', 'laptop', 'software', 'hardware', 'tech', 'coding', 'programming', 'ai', 'machine learning'],
    ai: ['ai ', 'artificial intelligence', 'chatgpt', 'llm', 'neural', 'deep learning', 'gpt', 'openai'],
    finance: ['money', 'invest', 'stock', 'crypto', 'budget', 'save', 'mortgage', 'loan', 'interest', 'retirement', '401k', 'tax'],
    education: ['school', 'college', 'university', 'sat', 'gpa', 'study', 'student', 'learn', 'course', 'degree'],
    fitness: ['workout', 'exercise', 'protein', 'calorie', 'diet', 'weight', 'muscle', 'health', 'bmi', 'heart rate'],
    shopping: ['buy', 'shop', 'product', 'review', 'deal', 'discount', 'price', 'amazon'],
    travel: ['travel', 'trip', 'flight', 'hotel', 'vacation', 'destination'],
    home: ['house', 'home', 'mortgage', 'rent', 'renovation', 'furniture', 'decor'],
    cars: ['car', 'auto', 'vehicle', 'mpg', 'fuel', 'insurance', 'driving'],
    entertainment: ['movie', 'music', 'stream', 'book', 'tv show', 'podcast'],
    productivity: ['task', 'project', 'workflow', 'efficiency', 'automate', 'organize'],
    business: ['business', 'startup', 'revenue', 'profit', 'marketing', 'sales', 'roi'],
    career: ['salary', 'resume', 'interview', 'job', 'career', 'hiring', 'promotion'],
    lifestyle: ['lifestyle', 'habit', 'routine', 'wellness', 'balance'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return category;
    }
  }
  return 'technology';
}
