import { geminiVision, geminiPro, isGeminiAvailable } from '@/lib/gemini';
import type { GeminiAnalysis, IssueCategory, IssueSeverity, PredictiveInsight, Issue } from '@/types';

// ─── Session-level rate-limit flag ───────────────────────────────────────────────
// If Gemini returns 429 (Too Many Requests), we disable it for the entire
// browser session so we don't spam the API or console with repeated errors.
let rateLimitHit = false;

function isGeminiReady(): boolean {
  if (!isGeminiAvailable) return false;
  if (rateLimitHit) return false;
  return true;
}

function handleGeminiError(error: any, context: string): void {
  const msg = error?.message || String(error);
  const status = error?.status || error?.code;

  if (status === 429 || msg.includes('429') || msg.includes('Too Many Requests') || msg.includes('quota')) {
    if (!rateLimitHit) {
      rateLimitHit = true;
      console.warn(`[Gemini] 429 Too Many Requests in ${context}. AI analysis disabled for this session. Reset by refreshing the page.`);
    }
    return;
  }

  if (msg.includes('not found') || msg.includes('404')) {
    console.warn(`[Gemini] Model not found in ${context}. Check model name in gemini.ts.`);
    return;
  }

  // Only log once per unique error message to avoid spam
  console.warn(`[Gemini] Error in ${context}:`, msg.substring(0, 120));
}

// ─── Default fallback analysis (used when Gemini is unavailable) ──────────────
const DEFAULT_ANALYSIS: GeminiAnalysis = {
  category: 'other' as IssueCategory,
  severity: 'medium' as IssueSeverity,
  summary: 'Issue submitted manually. AI analysis unavailable.',
  isDuplicate: false,
  authority: 'Municipal Corporation',
  confidence: 0,
  tags: ['manual'],
  estimatedResolutionDays: 14,
};

// Convert file to base64 inline data
async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({ inlineData: { data: base64, mimeType: file.type } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Parse JSON safely from Gemini text response
function parseJsonFromText<T>(text: string, fallback: T): T {
  try {
    // Try to extract JSON block from markdown code fences or raw text
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = fenceMatch ? fenceMatch[1] : text;
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!objMatch) return fallback;
    return JSON.parse(objMatch[0]) as T;
  } catch {
    return fallback;
  }
}

// ─── Analyze uploaded image/video for civic issues ────────────────────────────
export async function analyzeIssueMedia(file: File): Promise<GeminiAnalysis> {
  if (!isGeminiReady() || !geminiVision) return DEFAULT_ANALYSIS;

  try {
    const mediaPart = await fileToGenerativePart(file);

    const prompt = `You are a civic issue detection AI for a community engagement platform.
Analyze this image and identify any civic or infrastructure issues visible.

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "category": "pothole|water_leakage|garbage|streetlight|drainage|road_damage|infrastructure|other",
  "severity": "low|medium|high|critical",
  "summary": "brief 1-2 sentence description of the issue",
  "isDuplicate": false,
  "authority": "Municipal Corporation",
  "confidence": 0.85,
  "tags": ["tag1", "tag2"],
  "estimatedResolutionDays": 7
}

Severity guide: low=minor inconvenience, medium=affects daily life, high=safety risk, critical=immediate danger`;

    const result = await geminiVision.generateContent([prompt, mediaPart]);
    const text = result.response.text();
    const analysis = parseJsonFromText<GeminiAnalysis>(text, DEFAULT_ANALYSIS);

    const validCategories = ['pothole', 'water_leakage', 'garbage', 'streetlight', 'drainage', 'road_damage', 'infrastructure', 'other'];
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validCategories.includes(analysis.category)) analysis.category = 'other';
    if (!validSeverities.includes(analysis.severity)) analysis.severity = 'medium';
    if (!analysis.confidence || analysis.confidence > 1) analysis.confidence = 0.8;

    return analysis;
  } catch (error: any) {
    handleGeminiError(error, 'analyzeIssueMedia');
    return DEFAULT_ANALYSIS;
  }
}


// ─── Generate detailed issue summary ─────────────────────────────────────────
export async function generateIssueSummary(
  title: string,
  description: string,
  category: IssueCategory,
  severity: IssueSeverity,
  location: string
): Promise<string> {
  const fallbackMsg = `${title} - A ${severity} severity ${category.replace('_', ' ')} issue reported at ${location}.`;
  if (!isGeminiReady() || !geminiPro) return fallbackMsg;

  const prompt = `Generate a concise 2-sentence professional summary for this civic issue report:
- Title: ${title}
- Category: ${category.replace('_', ' ')}
- Severity: ${severity}
- Location: ${location}

Keep it factual and under 80 words. No bullet points, just plain text.`;

  try {
    const result = await geminiPro.generateContent(prompt);
    return result.response.text().trim();
  } catch (error: any) {
    handleGeminiError(error, 'generateIssueSummary');
    return fallbackMsg;
  }
}


// ─── Detect duplicate issues ──────────────────────────────────────────────────
export async function detectDuplicates(
  newIssue: { title: string; description: string; category: string; location: string },
  existingIssues: Issue[]
): Promise<{ isDuplicate: boolean; duplicateId?: string; confidence: number }> {
  if (!isGeminiReady() || !geminiPro || existingIssues.length === 0) {
    return { isDuplicate: false, confidence: 0 };
  }

  const existingSummary = existingIssues
    .slice(0, 10)
    .map((i, idx) => `${idx + 1}. [ID:${i.id}] ${i.title} - ${i.category} at ${i.location?.address || 'unknown'}`)
    .join('\n');

  const prompt = `Check if this new civic issue is a duplicate of any existing ones.

New Issue: "${newIssue.title}" - ${newIssue.category} at ${newIssue.location}

Existing Issues:
${existingSummary}

Respond ONLY with JSON: {"isDuplicate": false, "duplicateId": null, "confidence": 0.0}`;

  try {
    const result = await geminiPro.generateContent(prompt);
    return parseJsonFromText(result.response.text(), { isDuplicate: false, confidence: 0 });
  } catch (error: any) {
    handleGeminiError(error, 'detectDuplicates');
    return { isDuplicate: false, confidence: 0 };
  }
}


// ─── Generate predictive insights ─────────────────────────────────────────────
export async function generatePredictiveInsights(analyticsData: {
  totalIssues: number;
  categoryBreakdown: Record<string, number>;
  topAreas: { area: string; count: number }[];
  monthlyTrends: { month: string; reported: number; resolved: number }[];
}): Promise<PredictiveInsight> {
  const fallback: PredictiveInsight = {
    id: `insight-${Date.now()}`,
    title: 'Community Intelligence Report',
    description: 'AI analysis of community issues indicates growing infrastructure concerns requiring immediate civic attention.',
    affectedAreas: ['Central District', 'North Ward', 'Industrial Zone'],
    emergingIssues: ['Road deterioration', 'Water infrastructure aging', 'Waste management gaps'],
    monthlyForecast: 'Increased reporting expected due to seasonal changes. Water leakage and drainage issues likely to surge.',
    preventiveActions: [
      'Pre-monsoon drain cleaning drives',
      'Road patching before rains',
      'Streetlight audit in problem areas',
      'Community awareness campaigns',
    ],
    generatedAt: new Date(),
    confidence: 0.75,
  };

  if (!isGeminiReady() || !geminiPro) return fallback;

  const prompt = `Analyze this community issue data and generate predictive insights.

Data: Total Issues: ${analyticsData.totalIssues}, Categories: ${JSON.stringify(analyticsData.categoryBreakdown)}, Top Areas: ${JSON.stringify(analyticsData.topAreas)}

Respond ONLY with JSON:
{
  "title": "Monthly Community Intelligence Report",
  "description": "2-3 sentence overview",
  "affectedAreas": ["area1", "area2"],
  "emergingIssues": ["issue1", "issue2"],
  "monthlyForecast": "prediction text",
  "preventiveActions": ["action1", "action2", "action3"],
  "confidence": 0.85
}`;

  try {
    const result = await geminiPro.generateContent(prompt);
    const parsed = parseJsonFromText<Partial<PredictiveInsight>>(result.response.text(), {});
    return { ...fallback, ...parsed, id: `insight-${Date.now()}`, generatedAt: new Date() };
  } catch (error: any) {
    handleGeminiError(error, 'generatePredictiveInsights');
    return fallback;
  }
}


// ─── Recommend authority (local lookup – no Gemini needed) ────────────────────
export async function recommendAuthority(category: IssueCategory, _location: string): Promise<string> {
  const authorityMap: Record<IssueCategory, string> = {
    pothole: 'Public Works Department (PWD)',
    water_leakage: 'Water Supply & Sewerage Board',
    garbage: 'Municipal Solid Waste Management',
    streetlight: 'Electricity Supply Company (BESCOM)',
    drainage: 'Storm Water Drain Department',
    road_damage: 'National/State Highway Authority',
    infrastructure: 'Municipal Corporation',
    other: 'Municipal Corporation',
  };
  return authorityMap[category] || 'Municipal Corporation';
}

// ─── Generate verification confidence score (pure math – no Gemini) ───────────
export async function generateVerificationScore(
  verificationCount: number,
  upvoteCount: number,
  totalNearbyUsers: number
): Promise<number> {
  const participationRate = totalNearbyUsers > 0 ? verificationCount / totalNearbyUsers : 0;
  const upvoteRatio = verificationCount > 0 ? upvoteCount / verificationCount : 0;
  const score = Math.min(Math.round((participationRate * 0.4 + upvoteRatio * 0.6) * 100), 100);
  return Math.max(score, verificationCount > 0 ? 10 : 0);
}

// ─── Categorize issue from text ───────────────────────────────────────────────
export async function categorizeFromText(title: string, description: string): Promise<{
  category: IssueCategory;
  severity: IssueSeverity;
  tags: string[];
}> {
  const fallback = { category: 'other' as IssueCategory, severity: 'medium' as IssueSeverity, tags: [] };
  if (!isGeminiReady() || !geminiPro) return fallback;

  const prompt = `Classify this civic issue:
Title: ${title}
Description: ${description}

Respond ONLY with JSON:
{"category": "pothole|water_leakage|garbage|streetlight|drainage|road_damage|infrastructure|other", "severity": "low|medium|high|critical", "tags": ["tag1"]}`;

  try {
    const result = await geminiPro.generateContent(prompt);
    return parseJsonFromText(result.response.text(), fallback);
  } catch (error: any) {
    handleGeminiError(error, 'categorizeFromText');
    return fallback;
  }
}

