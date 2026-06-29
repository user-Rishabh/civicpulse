import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const envContent = fs.readFileSync(".env", "utf-8");
const match = envContent.match(/VITE_GEMINI_API_KEY\s*=\s*(.+)/);
if (!match) {
  console.error("VITE_GEMINI_API_KEY not found in .env");
  process.exit(1);
}
const apiKey = match[1].trim();

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    // We try to list models
    // In @google/generative-ai, listing models is done via the client or API endpoint
    // Wait, let's see how listModels is called. In some versions, there's no direct listModels on genAI,
    // but we can make a direct fetch to:
    // https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log("Models response status:", response.status);
    if (data.models) {
      console.log("Supported Models:");
      data.models.forEach(m => {
        console.log(`- Name: ${m.name}, Supported Methods: ${m.supportedGenerationMethods.join(", ")}`);
      });
    } else {
      console.log("No models returned. Full response:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Failed to list models:", err);
  }
}

listModels();
