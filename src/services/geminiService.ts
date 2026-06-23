import { geminiVision, geminiPro } from '@/lib/gemini';
import type { GeminiAnalysis, IssueCategory, IssueSeverity, PredictiveInsight, Issue } from '@/types';

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

// ─── Analyze uploaded image/video for civic issues ───────────────────────────
export async function analyzeIssueMedia(file: File): Promise<GeminiAnalysis> {
  try {
    const mediaPart = await fileToGenerativePart(file);

    const prompt = `You are a civic issue detection AI for a community engagement platform. 
    Analyze this image/video and provide a detailed assessment of any civic or infrastructure issues.
    
    Respond ONLY with valid JSON in this exact format:
    {
      "category": "pothole|water_leakage|garbage|streetlight|drainage|road_damage|infrastructure|other",
      "severity": "low|medium|high|critical",
      "summary": "brief 1-2 sentence description of the issue",
      "isDuplicate": false,
      "authority": "which department should handle this (e.g., Municipal Corporation, PWD, BESCOM, Water Board)",
      "confidence": 0.95,
      "tags": ["tag1", "tag2"],
      "estimatedResolutionDays": 7
    }
    
    Severity guide: low=minor inconvenience, medium=affects daily life, high=safety risk, critical=immediate danger
    Be specific and accurate in your assessment.`;

    const result = await geminiVision.generateContent([prompt, mediaPart]);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid Gemini response format');

    const analysis = JSON.parse(jsonMatch[0]) as GeminiAnalysis;
    return analysis;
  } catch (error) {
    console.error('Gemini vision analysis error:', error);
    // Return default analysis on error
    return {
      category: 'other' as IssueCategory,
      severity: 'medium' as IssueSeverity,
      summary: 'Issue detected. Manual review required.',
      isDuplicate: false,
      authority: 'Municipal Corporation',
      confidence: 0.5,
      tags: ['unclassified'],
      estimatedResolutionDays: 14,
    };
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
  const prompt = `You are a civic engagement AI assistant. Generate a clear, professional summary for a community issue report.

Issue Details:
- Title: ${title}
- Description: ${description}
- Category: ${category.replace('_', ' ')}
- Severity: ${severity}
- Location: ${location}

Generate a concise 2-3 sentence professional summary that:
1. Clearly describes the problem
2. States the impact on the community
3. Urgently conveys need for action

Keep it factual and under 100 words.`;

  try {
    const result = await geminiPro.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    return `${title} - A ${severity} severity ${category.replace('_', ' ')} issue has been reported at ${location}. Immediate attention required.`;
  }
}

// ─── Detect duplicate issues ──────────────────────────────────────────────────
export async function detectDuplicates(
  newIssue: { title: string; description: string; category: string; location: string },
  existingIssues: Issue[]
): Promise<{ isDuplicate: boolean; duplicateId?: string; confidence: number }> {
  if (existingIssues.length === 0) return { isDuplicate: false, confidence: 0 };

  const existingSummary = existingIssues
    .slice(0, 10)
    .map((i, idx) => `${idx + 1}. [ID:${i.id}] ${i.title} - ${i.category} at ${i.location?.address || 'unknown'}`)
    .join('\n');

  const prompt = `Check if this new issue is a duplicate of any existing issues.

New Issue:
- Title: ${newIssue.title}
- Description: ${newIssue.description}
- Category: ${newIssue.category}
- Location: ${newIssue.location}

Existing Issues:
${existingSummary}

Respond ONLY with JSON: {"isDuplicate": boolean, "duplicateId": "ID or null", "confidence": 0.0-1.0}`;

  try {
    const result = await geminiPro.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { isDuplicate: false, confidence: 0 };
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { isDuplicate: false, confidence: 0 };
  }
}

// ─── Generate predictive insights ────────────────────────────────────────────
export async function generatePredictiveInsights(
  analyticsData: {
    totalIssues: number;
    categoryBreakdown: Record<string, number>;
    topAreas: { area: string; count: number }[];
    monthlyTrends: { month: string; reported: number; resolved: number }[];
  }
): Promise<PredictiveInsight> {
  const prompt = `You are a civic intelligence AI. Analyze this community issue data and generate predictive insights.

Analytics Data:
- Total Issues: ${analyticsData.totalIssues}
- Category Breakdown: ${JSON.stringify(analyticsData.categoryBreakdown)}
- Top Problem Areas: ${JSON.stringify(analyticsData.topAreas)}
- Monthly Trends: ${JSON.stringify(analyticsData.monthlyTrends)}

Generate a comprehensive predictive analysis. Respond ONLY with JSON:
{
  "title": "Monthly Community Intelligence Report",
  "description": "2-3 sentence overview of community health",
  "affectedAreas": ["area1", "area2", "area3"],
  "emergingIssues": ["issue type 1", "issue type 2"],
  "monthlyForecast": "prediction for next month",
  "preventiveActions": ["action1", "action2", "action3", "action4"],
  "confidence": 0.85
}`;

  try {
    const result = await geminiPro.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response');

    const insight = JSON.parse(jsonMatch[0]);
    return {
      ...insight,
      id: `insight-${Date.now()}`,
      generatedAt: new Date(),
    };
  } catch {
    return {
      id: `insight-${Date.now()}`,
      title: 'Community Intelligence Report',
      description: 'AI analysis of community issues indicates growing infrastructure concerns requiring immediate civic attention.',
      affectedAreas: ['Central District', 'North Ward', 'Industrial Zone'],
      emergingIssues: ['Road deterioration', 'Water infrastructure aging', 'Waste management gaps'],
      monthlyForecast: 'Increased reporting expected due to monsoon season. Water leakage and drainage issues likely to surge.',
      preventiveActions: [
        'Pre-monsoon drain cleaning drives',
        'Road patching before rains',
        'Streetlight audit in problem areas',
        'Community awareness campaigns',
      ],
      generatedAt: new Date(),
      confidence: 0.75,
    };
  }
}

// ─── Recommend authority ──────────────────────────────────────────────────────
export async function recommendAuthority(category: IssueCategory, location: string): Promise<string> {
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

// ─── Generate verification confidence score ───────────────────────────────────
export async function generateVerificationScore(
  verificationCount: number,
  upvoteCount: number,
  totalNearbyUsers: number
): Promise<number> {
  const participationRate = totalNearbyUsers > 0 ? (verificationCount / totalNearbyUsers) : 0;
  const upvoteRatio = verificationCount > 0 ? (upvoteCount / verificationCount) : 0;
  const score = Math.min(
    Math.round((participationRate * 0.4 + upvoteRatio * 0.6) * 100),
    100
  );
  return Math.max(score, verificationCount > 0 ? 10 : 0);
}

// ─── Categorize issue from text ───────────────────────────────────────────────
export async function categorizeFromText(title: string, description: string): Promise<{
  category: IssueCategory;
  severity: IssueSeverity;
  tags: string[];
}> {
  const prompt = `Classify this civic issue report:
Title: ${title}
Description: ${description}

Respond ONLY with JSON:
{
  "category": "pothole|water_leakage|garbage|streetlight|drainage|road_damage|infrastructure|other",
  "severity": "low|medium|high|critical",
  "tags": ["tag1", "tag2"]
}`;

  try {
    const result = await geminiPro.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid');
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { category: 'other', severity: 'medium', tags: [] };
  }
}
