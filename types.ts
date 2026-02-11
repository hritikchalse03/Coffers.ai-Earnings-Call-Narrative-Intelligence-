export enum SpeakerType {
  OPERATOR = 'Operator',
  CEO = 'CEO',
  CFO = 'CFO',
  ANALYST = 'Analyst',
  SYSTEM = 'System'
}

export enum CallSection {
  PREPARED_REMARKS = 'Prepared Remarks',
  QA = 'Q&A'
}

export enum SignalDirection {
  STRENGTHENING = 'Strengthening',
  DETERIORATING = 'Deteriorating',
  NEUTRAL = 'Neutral',
  DIVERGING = 'Diverging'
}

export interface Discrepancy {
  type: 'Reversal' | 'Walk-back' | 'Scope Shrinkage' | 'Topic Silence' | 'New Risk';
  severity: 'Low' | 'Medium' | 'High';
  previousStatement: string; // What they said last quarter
  currentStatement: string;  // What they just said
  explanation: string;
}

export interface MarketEvent {
  id: string;
  date: string;
  type: 'Macro' | 'Sector' | 'Company';
  headline: string;
  impactLevel: 'Low' | 'Medium' | 'High';
}

export interface Attribution {
  event: MarketEvent;
  confidence: 'Low' | 'Medium' | 'High';
  reasoning: string; // Why this event likely caused the narrative shift
}

export interface TranscriptSegment {
  id: string;
  runId: string;       // UNIQUE RUN IDENTIFIER (UUID)
  sequenceId: number;  // MONOTONIC SEQUENCE ID
  ticker: string;
  companyName: string; // Explicit company name for UI sync
  timestamp: string;   // ISO time
  speaker: string;
  role: SpeakerType;
  text: string;
  section: CallSection;
}

export interface StreamMessage {
  type: 'TRANSCRIPT' | 'HEARTBEAT' | 'ERROR';
  data: {
    ticker: string;
    speaker: string;
    role: string;
    text: string;
    timestamp: number;
  };
}

export interface CompanyProfile {
  ticker: string;
  name: string;
  sector: string;
  marketCap: string;
  nextEarnings?: string;
  lastQuarterMomentum: number; // -100 to 100
}

export interface NarrativeDriver {
  quote: string;        // Verbatim phrase from transcript
  explanation: string;  // One-line context (optional in minimal UI)
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  trend: 'Up' | 'Down' | 'Flat'; // Explicit direction for UI arrow
  baselineDelta?: string; // New field for Deviation Intelligence: e.g., "+0.18 vs Q2"
}

export interface AnalysisResponse {
  confidenceScore: number;
  riskScore: number;
  confidenceDrivers: NarrativeDriver[];
  riskDrivers: NarrativeDriver[];
  toneAnalysis: string;
  consistencyNote: string;
  // New Intelligence Fields
  discrepancy?: Discrepancy;
  attribution?: Attribution;
  // Deviation Metrics
  deviationIndex?: number; // -1.0 to 1.0
  riskDrift?: number; // % change vs baseline
  commitmentConsistency?: number; // 0.0 to 1.0
}

export interface ConnectionState {
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
  latency: number;
  messageCount: number;
  error?: string;
}

export interface DashboardUpdateArgs {
  confidenceScore: number;
  riskScore: number;
  narrativeDriver: string;
  detectedSpeakerRole: string;
}