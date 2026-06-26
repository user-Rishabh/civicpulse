import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeIssueImage(base64Data, mimeType) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `You are a civic issue analyzer for Indian cities (Mumbai/Maharashtra focus).
Analyze this image and return ONLY raw JSON, no markdown, no backticks:
{
  "category": "one of: Pothole, Water Leak, Broken Streetlight, Garbage Dumping, Damaged Road, Encroachment, Flooding, Other",
  "severity": "one of: Low, Medium, High, Critical",
  "department": "one of: BMC, MSEDCL, NMMC, PWD, Traffic Police, Other",
  "description": "2 sentence description of the civic issue visible",
  "suggested_action": "one specific actionable sentence for the municipal department",
  "is_valid_issue": true or false,
  "estimated_resolution_days": number between 1 and 30
}`;

  const result = await model.generateContent([
    { inlineData: { data: base64Data, mimeType } },
    { text: prompt }
  ]);
  
  const text = result.response.text();
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function verifyInProgressImage(base64Data, mimeType, category) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `You are an AI assistant verifying municipal progress on civic issues (Category: ${category}).
Analyze this image and determine if it represents active construction, repairs, workers, scaffolding, barriers, or tools addressing the civic issue.
Return ONLY raw JSON (no markdown, no backticks):
{
  "is_verified": true or false,
  "reason": "a brief explanation of what is detected in the image (max 2 sentences)"
}`;

  const result = await model.generateContent([
    { inlineData: { data: base64Data, mimeType } },
    { text: prompt }
  ]);

  const text = result.response.text();
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function verifyResolvedImage(base64Data, mimeType, category) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `You are an AI assistant verifying if a civic issue (Category: ${category}) has been successfully repaired or resolved.
Analyze this image and determine if the issue has been cleared, fixed, or repaired (e.g. road is paved/flat, pothole is filled, leak is stopped, garbage is removed, streetlight is working).
Return ONLY raw JSON (no markdown, no backticks):
{
  "is_verified": true or false,
  "reason": "a brief explanation of what is detected in the image (max 2 sentences)"
}`;

  const result = await model.generateContent([
    { inlineData: { data: base64Data, mimeType } },
    { text: prompt }
  ]);

  const text = result.response.text();
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function analyzeWorkPhoto(base64Data, mimeType, issueCategory, stage) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `You are verifying municipal work progress for a civic issue.
Issue type: ${issueCategory}
Stage: ${stage} (either "work_started" or "work_completed")

Analyze this photo and return ONLY raw JSON:
{
  "is_valid_proof": true or false,
  "confidence": "High/Medium/Low",
  "observation": "one sentence about what you see in the image",
  "stage_confirmed": true or false
}
If stage is "work_started": confirm workers/equipment/materials are present
If stage is "work_completed": confirm the issue appears fixed/resolved`;

  const result = await model.generateContent([
    { inlineData: { data: base64Data, mimeType } },
    { text: prompt }
  ]);
  const text = result.response.text();
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function generateSupportReply({ userProfile, issue, chatHistory, userMessage }) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `You are "Gemini", an AI support assistant for the municipal corporation (CivicPulse).
Your goal is to answer a citizen's question about their reported issue, based on their account details and the specific issue status.

Citizen Profile:
- Name: ${userProfile?.name || "Citizen"}
- Email: ${userProfile?.email || "Unknown"}

Issue Details:
- Category: ${issue.category}
- Description: ${issue.description}
- Severity: ${issue.severity}
- Status: ${issue.status}
- Location: ${issue.location}
- Department Assigned: ${issue.department || "BMC"}
- Estimated Days to Resolve: ${issue.estimatedDays !== undefined && issue.estimatedDays !== null ? issue.estimatedDays : "Not set yet"}
- Resolution Plan: ${issue.resolutionPlan || "No plan submitted yet"}
- Officer Note: ${issue.officerNote || "No updates from officer yet"}

Recent Chat History:
${chatHistory.map(m => `[${m.senderRole === "citizen" ? "Citizen" : "Officer/Gemini"}]: ${m.text}`).join("\n")}

Citizen's New Message:
"${userMessage}"

Provide a concise, helpful, and polite response (max 3 sentences) addressing the citizen's question. Use the provided issue details to give concrete, real answers. Do not make up information. If estimated resolution or plan isn't set, politely let them know the department is reviewing it. Do not include any JSON or markdown formatting, just return the plain text response.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
