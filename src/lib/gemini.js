import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeIssueImage(base64Data, mimeType) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
