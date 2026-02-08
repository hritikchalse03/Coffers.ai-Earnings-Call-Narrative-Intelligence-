import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, SpeakerType, Discrepancy, Attribution } from '../types';
import { MOCK_Q2_CONTEXT, MOCK_MARKET_EVENTS } from '../constants';

export class NarrativeProcessor {
  private ai: GoogleGenAI | null = null;
  private buffer: string[] = [];
  private lastAnalysisTime = 0;
  private ANALYSIS_INTERVAL = 3500; 
  private contextWindow: string[] = []; 

  constructor(apiKey: string) {
    if (apiKey && apiKey !== "demo_mode" && !apiKey.startsWith("demo") && apiKey.length > 10) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  public addText(text: string) {
    this.buffer.push(text);
  }

  public async processBuffer(speakerRole: SpeakerType): Promise<AnalysisResponse | null> {
    const now = Date.now();
    const isDemo = !this.ai;
    
    if (this.buffer.length === 0) return null;
    
    // Process frequently in demo mode for fluid UI
    if (isDemo || (now - this.lastAnalysisTime > this.ANALYSIS_INTERVAL) || this.buffer.join(' ').length > 400) {
        const textToAnalyze = this.buffer.join(' ');
        this.buffer = []; 
        this.lastAnalysisTime = now;
        return await this.callGemini(textToAnalyze, speakerRole);
    }
    
    return null;
  }

  private async callGemini(text: string, role: SpeakerType): Promise<AnalysisResponse> {
    if (!this.ai) {
        return this.simulateAnalysis(text, role);
    }

    try {
        const prompt = `
        Analyze this earnings call segment for narrative shifts, risks, and discrepancies.
        
        Current Segment:
        Speaker: ${role}
        Text: "${text}"
        
        Previous Context Window: ${this.contextWindow.join(' ')}

        Task:
        1. Determine Confidence and Risk scores (0-100).
        2. Detect if this contradicts past guidance or narratives.
        3. Attribute shifts to likely market events if relevant.

        Output JSON only matching the AnalysisResponse schema.
        `;

        const response = await this.ai.models.generateContent({
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
                        confidenceDrivers: { type: Type.ARRAY, items: { type: Type.STRING } },
                        riskDrivers: { type: Type.ARRAY, items: { type: Type.STRING } },
                        toneAnalysis: { type: Type.STRING },
                        consistencyNote: { type: Type.STRING }
                    },
                    required: ["confidenceScore", "riskScore", "toneAnalysis"]
                }
            }
        });

        if (response.text) {
            const data = JSON.parse(response.text) as AnalysisResponse;
            this.contextWindow.push(`[${role}] ${data.toneAnalysis}`);
            if (this.contextWindow.length > 3) this.contextWindow.shift();
            return data;
        }
        throw new Error("No response text");

    } catch (e) {
        console.warn("Gemini API Error (falling back to simulation):", e);
        return this.simulateAnalysis(text, role);
    }
  }

  // ADVANCED SIMULATION ENGINE
  private simulateAnalysis(text: string, role: SpeakerType): AnalysisResponse {
    const lower = text.toLowerCase();
    
    // Base Scores
    let confidence = 55;
    let risk = 25;
    let tone = "Neutral execution updates";
    let discrepancy: Discrepancy | undefined;
    let attribution: Attribution | undefined;

    // 1. Detect Topics & Discrepancies vs Q2 Context
    if (lower.includes('margin') && (lower.includes('pressure') || lower.includes('headwind'))) {
        confidence = 40;
        risk = 75;
        tone = "Preparing market for margin compression";
        
        discrepancy = {
            type: 'Reversal',
            severity: 'High',
            previousStatement: MOCK_Q2_CONTEXT.margins,
            currentStatement: text.substring(0, 80) + "...",
            explanation: "Management explicitly guided for stable margins in Q2, now citing pressure."
        };

        // Attribute to event
        const event = MOCK_MARKET_EVENTS.find(e => e.headline.includes('TSMC'));
        if (event) {
            attribution = {
                event: event,
                confidence: 'High',
                reasoning: "TSMC packaging delays often increase COGS for chip designers due to expedited shipping/yielding costs."
            };
        }
    }

    if (lower.includes('china') || lower.includes('export') || lower.includes('geopolitical')) {
        confidence = 35;
        risk = 85;
        tone = "Defensive regarding regulatory exposure";

        discrepancy = {
            type: 'Walk-back',
            severity: 'Medium',
            previousStatement: MOCK_Q2_CONTEXT.china,
            currentStatement: text.substring(0, 80) + "...",
            explanation: "Q2 tone was dismissive of risk; Q3 tone acknowledges material uncertainty."
        };

        const event = MOCK_MARKET_EVENTS.find(e => e.headline.includes('Export controls'));
        if (event) {
            attribution = {
                event: event,
                confidence: 'High',
                reasoning: "Direct correlation with new Commerce Dept restrictions announced Sept 15."
            };
        }
    }

    if (lower.includes('demand') && lower.includes('insatiable')) {
        confidence = 95;
        risk = 10;
        tone = "Unapologetically bullish on long-term demand";
        // No discrepancy, consistent with Q2
    }

    // Add noise
    confidence += Math.floor(Math.random() * 6) - 3;
    risk += Math.floor(Math.random() * 6) - 3;

    return {
        confidenceScore: confidence,
        riskScore: risk,
        confidenceDrivers: [],
        riskDrivers: [],
        toneAnalysis: tone,
        consistencyNote: discrepancy ? "Significant divergence from Q2" : "Consistent with prior messaging",
        discrepancy,
        attribution
    };
  }
}