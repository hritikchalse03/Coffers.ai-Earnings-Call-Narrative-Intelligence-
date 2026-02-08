import { StreamMessage, TranscriptSegment, SpeakerType, CallSection, ConnectionState } from '../types';

type MessageCallback = (segment: TranscriptSegment) => void;
type StatusCallback = (state: ConnectionState) => void;

export class StreamService {
  private ws: WebSocket | null = null;
  private url: string;
  private apiKey: string;
  private messageCount = 0;
  private demoInterval: any;
  
  private onMessage: MessageCallback;
  private onStatus: StatusCallback;

  constructor(url: string, apiKey: string, onMessage: MessageCallback, onStatus: StatusCallback) {
    this.url = url;
    this.apiKey = apiKey;
    this.onMessage = onMessage;
    this.onStatus = onStatus;
  }

  public connect() {
    this.updateStatus('CONNECTING');
    // Always start demo mode if using demo URL or no key provided
    this.startDemoMode(); 
  }

  public disconnect() {
    clearInterval(this.demoInterval);
    this.updateStatus('DISCONNECTED');
  }

  private updateStatus(status: ConnectionState['status'], error?: string) {
    this.onStatus({
        status,
        latency: Math.floor(Math.random() * 20 + 10),
        messageCount: this.messageCount,
        error
    });
  }

  // --- DEMO MODE GENERATOR ---
  private startDemoMode() {
    this.updateStatus('CONNECTED');
    
    const DEMO_TRANSCRIPT = [
        // 1. OPENING - STRONG (Consistent)
        { speaker: "Jensen Huang", role: "CEO", text: "Good morning. We are witnessing the single greatest platform shift in computing history. Demand for our accelerated computing solutions is insatiable and broad-based." },
        
        // 2. THE MARGIN REVERSAL (Triggers Discrepancy + TSMC Event)
        { speaker: "Colette Kress", role: "CFO", text: "Turning to profitability. While revenue remains strong, we are seeing transient pressure on gross margins. We now expect margins to contract by 150 basis points in Q4 due to supply chain complexities." },
        
        // 3. THE EXPLANATION (Context)
        { speaker: "Colette Kress", role: "CFO", text: "Specifically, advanced packaging costs have risen as we work to secure capacity for the Blackwell ramp. This is a necessary investment." },
        
        // 4. THE GEOPOLITICAL WALK-BACK (Triggers Discrepancy + Govt Event)
        { speaker: "Analyst (Goldman)", role: "Analyst", text: "Colette, last quarter you said China restrictions would have 'no immediate impact'. Now you're guiding for a 5% hit. What changed?" },
        
        { speaker: "Jensen Huang", role: "CEO", text: "The regulatory landscape has shifted significantly since September. The new export controls are broader than anticipated. We are navigating this, but it introduces volatility." },
        
        // 5. THE REASSURANCE (Recovery)
        { speaker: "Jensen Huang", role: "CEO", text: "However, let me be clear: global demand outside of China is more than enough to offset this. We are sold out for the next 12 months." }
    ];

    let i = 0;
    
    // Emit first message immediately
    this.emitDemoMessage(DEMO_TRANSCRIPT[0]);
    i++;

    this.demoInterval = setInterval(() => {
        if (i >= DEMO_TRANSCRIPT.length) {
            i = 0; // Loop transcript
        }
        this.emitDemoMessage(DEMO_TRANSCRIPT[i]);
        i++;
    }, 4000); // 4s interval for better demo pacing
  }

  private emitDemoMessage(item: any) {
      const msg: StreamMessage = {
        type: 'TRANSCRIPT',
        data: {
            ticker: "NVDA",
            speaker: item.speaker,
            role: item.role,
            text: item.text,
            timestamp: Date.now()
        }
    };
    this.messageCount++;
    
    const segment: TranscriptSegment = {
        id: crypto.randomUUID(),
        ticker: "NVDA",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        speaker: item.speaker,
        role: item.role as SpeakerType,
        text: item.text,
        section: CallSection.PREPARED_REMARKS 
    };
    this.onMessage(segment);
  }
}