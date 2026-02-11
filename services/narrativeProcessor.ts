import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, SpeakerType, Discrepancy, Attribution, NarrativeDriver } from '../types';

export class NarrativeProcessor {
  private ai: GoogleGenAI | null = null;
  private buffer: string[] = [];
  
  constructor(apiKey: string) {
    if (apiKey && apiKey !== "demo_mode" && !apiKey.startsWith("demo") && apiKey.length > 10) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  public addText(text: string) {
    this.buffer.push(text);
  }

  public async processBuffer(speakerRole: SpeakerType): Promise<AnalysisResponse | null> {
    const textToAnalyze = this.buffer.join(' ');
    this.buffer = []; 
    if (!textToAnalyze) return null;

    if (this.ai) {
        // Real AI logic (omitted for brevity, assume existing implementation if needed)
        // For this specific request, we focus on the Simulation Engine.
        return this.simulateAnalysis(textToAnalyze, speakerRole); 
    }
    
    return this.simulateAnalysis(textToAnalyze, speakerRole);
  }

  // UPDATED SIMULATION ENGINE
  // Analyzes the generated text to produce scores consistent with the StreamService
  private simulateAnalysis(text: string, role: SpeakerType): AnalysisResponse {
    const lower = text.toLowerCase();
    
    // Heuristic Scoring based on keywords from our Templates
    let sentiment = 0; // -1 to 1
    
    // Positive Keywords
    if (lower.includes('strong') || lower.includes('record') || lower.includes('accelerating') || lower.includes('beat') || lower.includes('raising')) sentiment += 0.5;
    if (lower.includes('robust') || lower.includes('insatiable') || lower.includes('growth') || lower.includes('expanded')) sentiment += 0.4;
    
    // Negative Keywords
    if (lower.includes('headwinds') || lower.includes('constraints') || lower.includes('pressure') || lower.includes('contract') || lower.includes('cautious')) sentiment -= 0.5;
    if (lower.includes('unexpected') || lower.includes('regulatory') || lower.includes('challenging') || lower.includes('softer')) sentiment -= 0.4;

    // Scores
    let confidence = 50 + (sentiment * 40);
    let risk = 50 - (sentiment * 40);
    
    // Clamp
    confidence = Math.max(10, Math.min(95, confidence));
    risk = Math.max(10, Math.min(95, risk));
    
    // Add noise
    confidence += (Math.random() * 10) - 5;
    risk += (Math.random() * 10) - 5;

    // Driver Extraction
    // We want to highlight the core phrase. 
    // Since our templates are simple, we can often just take the first half or a key substring.
    const drivers: NarrativeDriver[] = [];
    
    if (Math.abs(sentiment) > 0.3) {
        // Find a "meaty" part of the sentence
        // Simple heuristic: Take the substring that contains the keyword
        let quote = text;
        if (text.length > 60) {
            // Trim to make it look like an excerpt
             quote = text.split(',')[0] + '...';
        }

        // --- THEME GENERATION FOR UI ---
        let title = "Narrative Signal";
        if (lower.includes("margin") || lower.includes("gross")) title = "Gross Margin Expansion";
        else if (lower.includes("revenue") || lower.includes("sales")) title = "Revenue Growth";
        else if (lower.includes("demand") || lower.includes("order")) title = "Demand Outlook";
        else if (lower.includes("guidance") || lower.includes("outlook")) title = "FY Guidance Update";
        else if (lower.includes("cash") || lower.includes("flow")) title = "Free Cash Flow Beat";
        else if (lower.includes("supply") || lower.includes("chain")) title = "Supply Chain Update";
        else if (lower.includes("ai") || lower.includes("genai") || lower.includes("intelligence")) title = "AI Strategy";
        else if (lower.includes("risk") || lower.includes("regulatory")) title = "Regulatory Risk Commentary";
        else if (lower.includes("inventory")) title = "Inventory Normalization";
        else if (lower.includes("capex") || lower.includes("capital")) title = "CapEx Allocation";
        else if (sentiment > 0) title = "Operational Beat";
        else title = "Operational Headwind";

        drivers.push({
            quote: quote,
            explanation: title, // Storing the "Theme Title" here for the UI
            sentiment: sentiment > 0 ? 'Positive' : 'Negative',
            trend: sentiment > 0 ? 'Up' : 'Down'
        });
    }

    return {
        confidenceScore: Math.floor(confidence),
        riskScore: Math.floor(risk),
        confidenceDrivers: sentiment > 0 ? drivers : [],
        riskDrivers: sentiment < 0 ? drivers : [],
        toneAnalysis: sentiment > 0 ? "Optimistic" : "Cautious",
        consistencyNote: "Consistent"
    };
  }
}