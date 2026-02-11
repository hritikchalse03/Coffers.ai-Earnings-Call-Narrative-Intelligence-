import { StreamMessage, TranscriptSegment, SpeakerType, CallSection, ConnectionState, AnalysisResponse, NarrativeDriver } from '../types';
import { COMPANIES, ANALYSTS, TEMPLATES, ADJECTIVES, TOPICS, SimCompany } from './simulationData';

type MessageCallback = (segment: TranscriptSegment) => void;
type StatusCallback = (state: ConnectionState) => void;

type Regime = 'Trending_Up' | 'Trending_Down' | 'Mean_Reversion' | 'High_Vol';

class SimulationSession {
  runId: string;
  company: SimCompany;
  analysts: string[];
  startTime: number;
  sequenceCounter: number; // Monotonic counter
  
  // Stochastic Process State
  momentum: number; 
  regime: Regime;
  regimeDuration: number; // How many ticks left in current regime
  
  messageLog: Set<string>; // Deduping

  constructor() {
    this.runId = crypto.randomUUID(); // UNIQUE RUN ID
    this.sequenceCounter = 0;
    
    this.company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
    // Randomize analysts (3 unique ones)
    this.analysts = [...ANALYSTS].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    this.startTime = Date.now();
    this.momentum = (Math.random() * 0.2) - 0.1; // Start near 0
    this.messageLog = new Set();
    
    // Initial Regime
    this.regime = 'Mean_Reversion';
    this.regimeDuration = 5 + Math.floor(Math.random() * 5); // 5-10 ticks

    console.log(`[Simulation] Init Run ${this.runId}: ${this.company.name} (${this.company.sector})`);
  }

  // CORE PHYSICS ENGINE: Stochastic Momentum Update
  // Uses a simplified Ornstein-Uhlenbeck process with regime switching
  updateMomentum(sentimentInput: number): number {
    // 1. Check Regime Transition
    this.regimeDuration--;
    if (this.regimeDuration <= 0) {
        this.switchRegime();
    }

    // 2. Define Physics based on Regime
    let drift = 0;
    let volatility = 0.05;
    let meanReversion = 0.1; // Strength of pull back to 0
    let targetMean = 0;

    switch (this.regime) {
        case 'Trending_Up':
            drift = 0.03;
            volatility = 0.04;
            meanReversion = 0.02; // Weak pull back
            targetMean = 0.8;
            break;
        case 'Trending_Down':
            drift = -0.03;
            volatility = 0.04;
            meanReversion = 0.02;
            targetMean = -0.8;
            break;
        case 'Mean_Reversion':
            drift = 0;
            volatility = 0.03;
            meanReversion = 0.15; // Strong pull to 0
            targetMean = 0;
            break;
        case 'High_Vol':
            drift = 0;
            volatility = 0.12; // High noise
            meanReversion = 0.05;
            targetMean = 0;
            break;
    }

    // 3. Calculate Components
    // A. Mean Reversion Component (pulls towards regime target)
    const reversion = meanReversion * (targetMean - this.momentum);
    
    // B. Drift Component (Trend)
    const trend = drift;

    // C. Shock Component (Input Sentiment from Text)
    // If text is strong positive, it pushes up regardless of regime, but regime resists/amplifies
    const shock = sentimentInput * 0.2;

    // D. Noise Component (Brownian Motion)
    const noise = (Math.random() * volatility * 2) - volatility;

    // 4. Update
    let delta = reversion + trend + shock + noise;
    
    // Damping: Prevent momentum from getting stuck at extreme edges
    if (this.momentum > 0.9 && delta > 0) delta *= 0.1;
    if (this.momentum < -0.9 && delta < 0) delta *= 0.1;

    this.momentum += delta;

    // Hard clamp
    this.momentum = Math.max(-1, Math.min(1, this.momentum));
    
    return this.momentum;
  }

  private switchRegime() {
    const r = Math.random();
    // Transition probabilities
    if (r < 0.30) this.regime = 'Mean_Reversion';
    else if (r < 0.55) this.regime = 'Trending_Up';
    else if (r < 0.80) this.regime = 'Trending_Down';
    else this.regime = 'High_Vol';

    this.regimeDuration = 8 + Math.floor(Math.random() * 12); // New duration 8-20 ticks
  }
}

export class StreamService {
  private url: string;
  private apiKey: string;
  private messageCount = 0;
  private demoInterval: any;
  private onMessage: MessageCallback;
  private onStatus: StatusCallback;
  
  private session: SimulationSession | null = null;

  constructor(url: string, apiKey: string, onMessage: MessageCallback, onStatus: StatusCallback) {
    this.url = url;
    this.apiKey = apiKey;
    this.onMessage = onMessage;
    this.onStatus = onStatus;
  }

  public connect() {
    this.updateStatus('CONNECTING');
    this.startSimulation(); 
  }

  public disconnect() {
    clearInterval(this.demoInterval);
    this.updateStatus('DISCONNECTED');
    this.session = null;
  }

  private updateStatus(status: ConnectionState['status'], error?: string) {
    this.onStatus({
        status,
        latency: Math.floor(Math.random() * 20 + 10),
        messageCount: this.messageCount,
        error
    });
  }

  private startSimulation() {
    this.session = new SimulationSession();
    this.updateStatus('CONNECTED');

    // Initial delay then loop
    setTimeout(() => this.generateSegment(), 500);

    // Realistic cadence: vary between 3s and 6s
    const scheduleNext = () => {
        if (!this.session) return;
        this.generateSegment();
        const delay = 3000 + Math.random() * 3000;
        this.demoInterval = setTimeout(scheduleNext, delay);
    };
    this.demoInterval = setTimeout(scheduleNext, 3000);
  }

  private generateSegment() {
    if (!this.session) return;
    
    // 1. Determine Speaker & Role
    const r = Math.random();
    let speaker = "";
    let role = SpeakerType.CEO;
    let section = CallSection.PREPARED_REMARKS;

    // 25% Analyst Q, 35% CEO, 40% CFO
    if (r < 0.25) {
        role = SpeakerType.ANALYST;
        speaker = this.session.analysts[Math.floor(Math.random() * this.session.analysts.length)];
        section = CallSection.QA;
    } else if (r < 0.60) {
        role = SpeakerType.CEO;
        speaker = this.session.company.ceo;
    } else {
        role = SpeakerType.CFO;
        speaker = this.session.company.cfo;
    }

    // 2. Determine Sentiment based on Current Regime & Randomness
    let sentimentType: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'QA_QUESTION' = 'NEUTRAL';
    
    if (role === SpeakerType.ANALYST) {
        sentimentType = 'QA_QUESTION';
    } else {
        const regime = this.session.regime;
        let posProb = 0.33;
        let negProb = 0.33;

        if (regime === 'Trending_Up') { posProb = 0.7; negProb = 0.1; }
        if (regime === 'Trending_Down') { posProb = 0.1; negProb = 0.7; }
        if (regime === 'High_Vol') { posProb = 0.45; negProb = 0.45; }

        const s = Math.random();
        if (s < posProb) sentimentType = 'POSITIVE';
        else if (s < posProb + negProb) sentimentType = 'NEGATIVE';
        else sentimentType = 'NEUTRAL';
    }

    // 3. Generate Text
    const text = this.generateText(this.session.company, sentimentType);
    
    // 4. Calculate Scores
    let sentimentVal = 0;
    if (sentimentType === 'POSITIVE') sentimentVal = 1;
    if (sentimentType === 'NEGATIVE') sentimentVal = -1;
    
    const newMomentum = this.session.updateMomentum(sentimentVal);
    
    // 5. Construct Transcript Segment with RUN CONTEXT
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.session.sequenceCounter++;

    const segment: TranscriptSegment = {
        id: crypto.randomUUID(),
        runId: this.session.runId,           // CRITICAL: Scope to this run
        sequenceId: this.session.sequenceCounter, // CRITICAL: Strict ordering
        ticker: this.session.company.ticker,
        companyName: this.session.company.name, // CRITICAL: Sync header
        timestamp: timestampStr,
        speaker: speaker,
        role: role,
        text: text,
        section: section
    };

    // 6. Emit
    this.messageCount++;
    this.onMessage(segment);
  }

  private generateText(company: SimCompany, type: string): string {
    // @ts-ignore
    const templates = TEMPLATES[type === 'QA_QUESTION' ? 'QA_QUESTION' : type];
    
    let attempts = 0;
    let text = "";
    
    while (attempts < 5) {
        const template = templates[Math.floor(Math.random() * templates.length)];
        const product = company.products[Math.floor(Math.random() * company.products.length)];
        const adj = type === 'POSITIVE' 
            ? ADJECTIVES.POSITIVE[Math.floor(Math.random() * ADJECTIVES.POSITIVE.length)]
            : ADJECTIVES.NEGATIVE[Math.floor(Math.random() * ADJECTIVES.NEGATIVE.length)];
        const num = (Math.random() * 15 + 2).toFixed(1);

        text = template
            .replace('{product}', product)
            .replace('{adj}', adj)
            .replace('{number}', num);

        if (!this.session?.messageLog.has(text)) {
            break;
        }
        attempts++;
    }
    
    this.session?.messageLog.add(text);
    return text;
  }
}