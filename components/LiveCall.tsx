import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Play, Pause, RefreshCw, Zap, TrendingUp, AlertCircle, Activity, Mic, ArrowDown } from 'lucide-react';
import { TranscriptSegment, ConnectionState, AnalysisResponse } from '../types';
import { StreamService } from '../services/streamService';
import { NarrativeProcessor } from '../services/narrativeProcessor';

export const LiveCall: React.FC = () => {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  
  // KPI States
  const [confidence, setConfidence] = useState(50);
  const [risk, setRisk] = useState(20);
  const [momentum, setMomentum] = useState(0);
  const [discrepancyLevel, setDiscrepancyLevel] = useState<'Low' | 'Medium' | 'High'>('Low');

  const [isPlaying, setIsPlaying] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  const streamServiceRef = useRef<StreamService | null>(null);
  const processorRef = useRef<NarrativeProcessor | null>(null);
  
  // Scroll Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    processorRef.current = new NarrativeProcessor("demo_mode");
    streamServiceRef.current = new StreamService("demo://nvda", "demo_key", handleNewSegment, () => {});
    streamServiceRef.current.connect();

    return () => streamServiceRef.current?.disconnect();
  }, []);

  // Reliable Auto-scroll logic using anchor ref
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      // Use 'auto' behavior to prevent fighting if updates are frequent
      // or 'smooth' if pace is slow. 'smooth' is nicer UI.
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [segments, autoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    // Check if user is near the bottom
    // Reduced threshold to 50px to make "breaking" auto-scroll easier when intentional
    const distanceFromBottom = scrollHeight - Math.ceil(scrollTop) - clientHeight;
    const isAtBottom = distanceFromBottom <= 50;
    
    // Only update state if it changes to avoid re-renders
    if (isAtBottom !== autoScroll) {
        setAutoScroll(isAtBottom);
    }
  };

  const handleNewSegment = async (segment: TranscriptSegment) => {
    if (!isPlaying) return;

    setSegments(prev => [...prev, segment]);

    if (processorRef.current) {
        processorRef.current.addText(segment.text);
        const analysis = await processorRef.current.processBuffer(segment.role);
        
        if (analysis) {
            updateMetrics(analysis, segment.timestamp);
        }
    }
  };

  const updateMetrics = (analysis: AnalysisResponse, timestamp: string) => {
      setConfidence(analysis.confidenceScore);
      setRisk(analysis.riskScore);
      
      // Calculate Sentiment (-1 to 1) based on Confidence vs Risk
      const sentiment = parseFloat(((analysis.confidenceScore - analysis.riskScore) / 100).toFixed(2));
      setMomentum(sentiment);
      
      if (analysis.discrepancy) {
          setDiscrepancyLevel(analysis.discrepancy.severity);
      }

      setChartData(prev => {
          const newData = [...prev, { time: timestamp, value: sentiment }];
          // Keep last 60 seconds
          if (newData.length > 60) return newData.slice(newData.length - 60);
          return newData;
      });
  };

  const togglePlayback = () => {
      setIsPlaying(!isPlaying);
      if (!isPlaying) {
          // If resuming, snap to bottom immediately
          setAutoScroll(true);
      }
  };

  // Gradient offset for Chart (Green above 0, Red below 0)
  const gradientOffset = () => {
    if (chartData.length === 0) return 0;
    const dataMax = Math.max(...chartData.map((i) => i.value));
    const dataMin = Math.min(...chartData.map((i) => i.value));
  
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
  
    return dataMax / (dataMax - dataMin);
  };
  
  const off = gradientOffset();

  return (
    <div className="flex flex-col gap-6">
      
      {/* SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 h-[600px] border border-borderLight rounded-2xl overflow-hidden shadow-sm bg-white">
        
        {/* LEFT: Transcript Stream */}
        <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-borderLight bg-white relative h-full min-h-0">
            {/* Header */}
            <div className="h-14 flex-none flex items-center justify-between px-6 border-b border-borderLight bg-white/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[13px] font-medium text-text">Live Transcript</span>
                </div>
                <button onClick={togglePlayback} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-text">
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
            </div>

            {/* Content */}
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-white min-h-0"
            >
                {segments.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-muted gap-3 opacity-50">
                        <Mic size={24} />
                        <span className="text-[13px]">Waiting for audio stream...</span>
                    </div>
                )}
                {segments.map((seg, i) => (
                    <div key={i} className="flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-baseline gap-2">
                            <span className="text-[12px] font-semibold text-text">
                                {seg.speaker}
                            </span>
                            <span className="text-[10px] text-muted font-mono">{seg.timestamp}</span>
                        </div>
                        <div className={`
                            text-[14px] leading-relaxed text-text/90 py-2 px-3 rounded-lg rounded-tl-none
                            ${seg.role === 'Analyst' ? 'bg-gray-50' : 'bg-white border border-borderLight'}
                        `}>
                            {seg.text}
                        </div>
                    </div>
                ))}
                {/* Invisible Anchor for Auto-scrolling */}
                <div ref={messagesEndRef} className="h-px w-full" />
            </div>
            
            {!autoScroll && (
                <button 
                    onClick={() => {
                        setAutoScroll(true);
                        // Force instant scroll to bottom on click
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-text text-white text-[12px] font-medium rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 z-20 hover:bg-black/90 transition-colors"
                >
                    <ArrowDown size={14} /> Resume Scrolling
                </button>
            )}
        </div>

        {/* RIGHT: Real-time Chart */}
        <div className="flex flex-col bg-white relative h-full min-h-0">
             <div className="h-14 flex-none flex items-center justify-between px-6 border-b border-borderLight bg-white">
                <span className="text-[13px] font-medium text-text">Narrative Momentum</span>
                <span className="text-[11px] text-muted bg-gray-50 px-2 py-1 rounded border border-borderLight">1s Update Interval</span>
            </div>
            
            <div className="flex-1 p-2 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset={off} stopColor="#22c55e" stopOpacity={0.05} />
                                <stop offset={off} stopColor="#ef4444" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="splitStroke" x1="0" y1="0" x2="0" y2="1">
                                <stop offset={off} stopColor="#22c55e" stopOpacity={1} />
                                <stop offset={off} stopColor="#ef4444" stopOpacity={1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[-1, 1]} hide />
                        <ReferenceLine y={0} stroke="#000" strokeOpacity={0.1} strokeDasharray="3 3" />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#fff', 
                                border: '1px solid rgba(0,0,0,0.06)', 
                                borderRadius: '8px', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                fontSize: '12px'
                            }} 
                            itemStyle={{ color: '#000' }}
                            formatter={(val: number) => [val.toFixed(2), "Momentum"]}
                            labelStyle={{ display: 'none' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="url(#splitStroke)" 
                            fill="url(#splitColor)" 
                            strokeWidth={2}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* BOTTOM: KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Confidence" value={confidence} suffix="%" icon={<Activity size={14} />} />
          <KpiCard label="Risk Level" value={risk} suffix="%" icon={<AlertCircle size={14} />} color={risk > 50 ? 'text-red-500' : 'text-text'} />
          <KpiCard label="Momentum" value={momentum > 0 ? `+${momentum}` : momentum} icon={<TrendingUp size={14} />} color={momentum > 0 ? 'text-green-600' : 'text-red-500'} />
          <KpiCard label="Discrepancy" value={discrepancyLevel} icon={<RefreshCw size={14} />} />
          <KpiCard label="Event Link" value="High" icon={<Zap size={14} />} />
          <KpiCard label="CEO-CFO Gap" value="0.4" icon={<Activity size={14} />} />
      </div>
    </div>
  );
};

// Compact KPI Card Component
const KpiCard = ({ label, value, suffix = '', icon, color = 'text-text' }: any) => (
    <div className="bg-white border border-borderLight rounded-xl p-4 flex flex-col justify-between shadow-sm h-24 hover:border-gray-300 transition-colors cursor-default">
        <div className="flex items-center gap-2 text-muted text-[11px] font-medium uppercase tracking-wide">
            {icon} {label}
        </div>
        <div className={`text-[24px] font-semibold tracking-tight ${color}`}>
            {value}<span className="text-[14px] text-muted font-normal ml-0.5">{suffix}</span>
        </div>
    </div>
);