import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, SpeakerType, NarrativeDriver } from '../types';

let ai: GoogleGenAI | null = null;

// Initialize Gemini
const getAiClient = () => {
  if (!ai) {
    if (process.env.API_KEY) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
  }
  return ai;
};

export const analyzeSegment = async (
  text: string,
  speakerRole: SpeakerType,
  previousContext: string
): Promise<AnalysisResponse> => {
  const client = getAiClient();
  
  // Fallback if no API key
  if (!client) {
    console.warn("No API Key found, returning mock analysis");
    return mockAnalysis(text, speakerRole);
  }

  const prompt = `
    Role: Financial Narrative Intelligence Analyst.
    Task: Analyze the following earnings call transcript segment for narrative signals.
    
    Context:
    Speaker Role: ${speakerRole}
    Previous Context Summary: ${previousContext}
    Current Segment: "${text}"

    Analyze for:
    1. Confidence Score (0-100): How assertive/certain is the speaker? High score = very confident.
    2. Risk Score (0-100): How much defensive/hedging language is used? High score = high risk signaling.
    3. Drivers: Extract 1-3 specific VERBATIM quotes from the text that drove these scores.
    4. Tone Analysis: Brief sentence explaining the tone (e.g., "Defensive regarding margins").
    5. Consistency: Does this align with typical ${speakerRole} behavior?
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            confidenceScore: { type: Type.INTEGER },
            riskScore: { type: Type.INTEGER },
            confidenceDrivers: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  quote: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  sentiment: { type: Type.STRING, enum: ["Positive", "Negative", "Neutral"] },
                  trend: { type: Type.STRING, enum: ["Up", "Down", "Flat"] }
                },
                required: ["quote", "explanation", "sentiment", "trend"]
              } 
            },
            riskDrivers: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  quote: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  sentiment: { type: Type.STRING, enum: ["Positive", "Negative", "Neutral"] },
                  trend: { type: Type.STRING, enum: ["Up", "Down", "Flat"] }
                },
                required: ["quote", "explanation", "sentiment", "trend"]
              } 
            },
            toneAnalysis: { type: Type.STRING },
            consistencyNote: { type: Type.STRING }
          },
          required: ["confidenceScore", "riskScore", "confidenceDrivers", "riskDrivers", "toneAnalysis"]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as AnalysisResponse;
    }
    throw new Error("Empty response");

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return mockAnalysis(text, speakerRole);
  }
};

// Fallback mock analysis for when API is not available or fails
const mockAnalysis = (text: string, role: SpeakerType): AnalysisResponse => {
  const isRisk = text.toLowerCase().includes("risk") || text.toLowerCase().includes("headwind") || text.toLowerCase().includes("pressure");
  const isConfidence = text.toLowerCase().includes("record") || text.toLowerCase().includes("accelerating") || text.toLowerCase().includes("strong");
  
  let conf = 50;
  let risk = 20;

  if (isConfidence) conf += 30;
  if (isRisk) {
      risk += 40;
      conf -= 20;
  }
  
  if (role === SpeakerType.CFO) {
      risk += 10; // CFOs are naturally more cautious
      conf -= 5;
  }

  // Construct mock drivers based on simple string matching
  const confDrivers: NarrativeDriver[] = [];
  const riskDrivers: NarrativeDriver[] = [];

  if (isConfidence) {
      confDrivers.push({
          quote: text.length > 20 ? text.substring(0, 20) + "..." : text,
          explanation: "Direct assertion of strength",
          sentiment: "Positive",
          trend: "Up"
      });
  }

  if (isRisk) {
      riskDrivers.push({
          quote: "pressure on gross margins", // Mock attempt to find substring
          explanation: "Hedging language detected",
          sentiment: "Negative",
          trend: "Down"
      });
  }

  return {
    confidenceScore: Math.max(0, Math.min(100, conf)),
    riskScore: Math.max(0, Math.min(100, risk)),
    confidenceDrivers: confDrivers,
    riskDrivers: riskDrivers,
    toneAnalysis: isRisk ? "Cautious and defensive" : "Optimistic and forward-looking",
    consistencyNote: "Aligned with role expectations"
  };
};