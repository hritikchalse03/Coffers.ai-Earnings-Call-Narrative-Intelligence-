import { GoogleGenAI, FunctionDeclaration, Type, LiveServerMessage, Modality } from "@google/genai";
import { DashboardUpdateArgs } from '../types';

// Audio Context Global References
let inputAudioContext: AudioContext | null = null;
let scriptProcessor: ScriptProcessorNode | null = null;
let mediaStream: MediaStream | null = null;

// Tool Definition: The model uses this to update the UI
const updateDashboardTool: FunctionDeclaration = {
  name: 'updateDashboard',
  parameters: {
    type: Type.OBJECT,
    description: 'Updates the dashboard with real-time narrative analysis based on the earnings call audio.',
    properties: {
      confidenceScore: {
        type: Type.NUMBER,
        description: 'Current management confidence level (0-100). 100 is extreme confidence.',
      },
      riskScore: {
        type: Type.NUMBER,
        description: 'Current level of risk hedging or defensive language (0-100).',
      },
      narrativeDriver: {
        type: Type.STRING,
        description: 'A concise (5-10 words) explanation of what triggered this signal.',
      },
      detectedSpeakerRole: {
        type: Type.STRING,
        description: 'Who is likely speaking? Options: CEO, CFO, ANALYST, OPERATOR.',
      }
    },
    required: ['confidenceScore', 'riskScore', 'narrativeDriver', 'detectedSpeakerRole'],
  },
};

export class LiveCallService {
  private client: GoogleGenAI;
  private onTranscript: (text: string) => void;
  private onDashboardUpdate: (data: DashboardUpdateArgs) => void;
  private sessionPromise: Promise<any> | null = null;
  private isConnected: boolean = false;

  constructor(
    onTranscript: (text: string) => void,
    onDashboardUpdate: (data: DashboardUpdateArgs) => void
  ) {
    this.client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.onTranscript = onTranscript;
    this.onDashboardUpdate = onDashboardUpdate;
  }

  async connect() {
    if (this.isConnected) return;

    inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 16000, // Gemini prefers 16kHz
    });

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000
        } 
      });
    } catch (e) {
      console.error("Microphone access denied", e);
      throw e;
    }

    this.sessionPromise = this.client.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          console.log("Gemini Live Session Opened");
          this.isConnected = true;
          this.startAudioStream();
        },
        onmessage: async (message: LiveServerMessage) => {
          this.handleMessage(message);
        },
        onclose: () => {
          console.log("Gemini Live Session Closed");
          this.isConnected = false;
        },
        onerror: (err) => {
          console.error("Gemini Live Error", err);
          this.disconnect();
        }
      },
      config: {
        responseModalities: [Modality.AUDIO], // Required even if we mostly rely on tool calls
        inputAudioTranscription: {}, // Enable User Transcription
        systemInstruction: `
          You are a highly sophisticated Financial Narrative Intelligence Engine. 
          Your job is to listen to a live earnings call.
          Do NOT behave like a chatbot. Do NOT have a conversation.
          
          Continuously analyze the audio for:
          1. Management Confidence (Strong phrasing, direct answers vs hedging).
          2. Risk Signals (Macro headwinds, supply chain issues, margin compression).
          3. Consistency.
          
          When you detect a meaningful sentence or paragraph, call the 'updateDashboard' function immediately with your scores and analysis.
          Estimate the speaker role (CEO vs CFO) based on the content (CFO usually talks numbers/margins, CEO talks strategy/vision).
        `,
        tools: [{ functionDeclarations: [updateDashboardTool] }]
      }
    });
  }

  private startAudioStream() {
    if (!inputAudioContext || !mediaStream || !this.sessionPromise) return;

    const source = inputAudioContext.createMediaStreamSource(mediaStream);
    scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);

    scriptProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = this.floatTo16BitPCM(inputData);
      const base64Audio = this.arrayBufferToBase64(pcm16);

      this.sessionPromise?.then(session => {
        session.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Audio
          }
        });
      });
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(inputAudioContext.destination);
  }

  private handleMessage(message: LiveServerMessage) {
    // 1. Handle Transcription (What the user/mic said)
    const transcript = message.serverContent?.inputTranscription?.text;
    if (transcript) {
      this.onTranscript(transcript);
    }

    // 2. Handle Tool Calls (The Analysis)
    if (message.toolCall) {
      message.toolCall.functionCalls.forEach(fc => {
        if (fc.name === 'updateDashboard') {
          const args = fc.args as unknown as DashboardUpdateArgs;
          this.onDashboardUpdate(args);
          
          // We must send a response back to keep the loop healthy, 
          // though for this specific use case, the model doesn't need to 'do' anything after.
          this.sessionPromise?.then(session => {
            session.sendToolResponse({
                functionResponses: {
                    id: fc.id,
                    name: fc.name,
                    response: { result: "Dashboard updated successfully" }
                }
            });
          });
        }
      });
    }
  }

  disconnect() {
    if (scriptProcessor) {
      scriptProcessor.disconnect();
      scriptProcessor = null;
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }
    if (inputAudioContext) {
      inputAudioContext.close();
      inputAudioContext = null;
    }
    this.isConnected = false;
    // Note: No explicit .close() method on the session object in this SDK version typically exposed,
    // usually handled by closing the transport, but here we just stop sending.
  }

  private floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}