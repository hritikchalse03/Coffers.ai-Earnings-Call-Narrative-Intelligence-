import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Play, Pause, RefreshCw, Zap, TrendingUp, AlertCircle, Activity, Mic, ArrowDown } from 'lucide-react';
import { TranscriptSegment, AnalysisResponse } from '../types';
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
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [showResumeBtn, setShowResumeBtn] = useState(false);

  const streamServiceRef = useRef<StreamService | null>(null);
  const processorRef = useRef<NarrativeProcessor | null>(null);
  
  // Scroll Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    processorRef.current = new NarrativeProcessor("demo_mode");
    streamServiceRef.current = new StreamService("demo://nvda", "demo_key", handleNewSegment, () => {});
    streamServiceRef.current.connect();

    return () => streamServiceRef.current?.disconnect();
  }, []);

  // --- CRITICAL SCROLL FIX ---
  // We use layout effects to scroll immediately after DOM updates to prevent visual jitter.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (isAutoScrolling) {
      container.scrollTop = container.scrollHeight;
    }
  }, [segments, isAutoScrolling]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Tolerance of 50px to consider "at bottom"
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;

    if (isAtBottom) {
      setIsAutoScrolling(true);
      setShowResumeBtn(false);
    } else {
      setIsAutoScrolling(false);
      setShowResumeBtn(true);
    }
  };

  const resumeScrolling = () => {
    setIsAutoScrolling(true);
    setShowResumeBtn(false);
  };

  const handleNewSegment = async (segment: TranscriptSegment) => {
    if (!isPlaying) return;

    setSegments(prev => {
        // Limit history to 100 items for performance in this demo
        const newSegs = [...prev, segment];
        if (newSegs.length > 100) return newSegs.slice(newSegs.length - 100);
        return newSegs;
    });

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
      
      const sentiment = parseFloat(((analysis.confidenceScore - analysis.riskScore) / 100).toFixed(2));
      setMomentum(sentiment);
      
      if (analysis.discrepancy) {
          setDiscrepancyLevel(analysis.discrepancy.severity);
      }

      setChartData(prev => {
          const newData = [...prev, { time: timestamp, value: sentiment }];
          if (newData.length > 60) return newData.slice(newData.length - 60);
          return newData;
      });
  };

  const togglePlayback = () => {
      setIsPlaying(!isPlaying);
      if (!isPlaying) resumeScrolling();
  };

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
    <div className="w-full max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-12 lg:h-[600px] border border-borderLight rounded-xl overflow-hidden shadow-sm bg-white">
      
      {/* LEFT COLUMN: Transcript Stream (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-borderLight bg-white relative h-[400px] lg:h-full min-h-0">
          {/* Header */}
          <div className="h-12 flex-none flex items-center justify-between px-5 border-b border-borderLight bg-white z-10">
              <div className="flex items-center gap-2.5">
                  <div className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPlaying ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? 'bg-red-600' : 'bg-gray-500'}`}></span>
                  </div>
                  <span className="text-[13px] font-medium text-text tracking-tight">Live Transcript</span>
              </div>
              <button onClick={togglePlayback} className="p-1.5 hover:bg-gray-50 rounded-md transition-colors text-muted hover:text-text">
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
          </div>

          {/* Content Container - Fixed Height & Scrollable */}
          <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto bg-white min-h-0 scroll-smooth-none relative"
          >
              {segments.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-muted gap-3 opacity-40">
                      <Mic size={20} strokeWidth={1.5} />
                      <span className="text-[13px] font-medium">Connecting to stream...</span>
                  </div>
              )}
              
              <div className="flex flex-col">
                  {segments.map((seg, i) => (
                      <div 
                          key={i} 
                          className={`
                              py-3 px-5 border-b border-borderLight/50 last:border-0
                              ${seg.role === 'Analyst' ? 'bg-[#FAFAFA]' : 'bg-white'}
                              transition-colors duration-200
                          `}
                      >
                          <div className="flex items-baseline justify-between mb-1">
                              <span className={`text-[12px] font-semibold tracking-tight ${seg.role === 'CEO' ? 'text-blue-600' : seg.role === 'CFO' ? 'text-emerald-600' : 'text-text'}`}>
                                  {seg.speaker}
                              </span>
                              <span className="text-[10px] text-muted font-mono opacity-60 tabular-nums">{seg.timestamp}</span>
                          </div>
                          <div className="text-[13px] leading-relaxed text-text/90">
                              {seg.text}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
          
          {/* Floating Resume Button */}
          <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-300 ${showResumeBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <button 
                  onClick={resumeScrolling}
                  className="pl-3 pr-4 py-1.5 bg-text text-white text-[11px] font-medium rounded-full shadow-lg flex items-center gap-2 hover:bg-black/90 hover:shadow-xl transition-all"
              >
                  <ArrowDown size={12} /> Resume Live
              </button>
          </div>
      </div>

      {/* RIGHT COLUMN: Stacked Chart (50%) & KPIs (50%) */}
      <div className="lg:col-span-5 flex flex-col h-full">
           
          {/* TOP HALF: Real-time Chart */}
          <div className="flex-1 lg:h-1/2 min-h-[250px] lg:min-h-0 flex flex-col bg-white border-b border-borderLight relative overflow-hidden">
               <div className="h-12 flex-none flex items-center justify-between px-5 border-b border-borderLight bg-white z-10">
                  <span className="text-[13px] font-medium text-text tracking-tight">Narrative Momentum</span>
                  <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span className="text-[11px] text-muted font-medium tabular-nums">Live</span>
                  </div>
              </div>
              
              <div className="flex-1 p-0 relative w-full h-full min-h-0">
                  {/* Gradient overlay for depth */}
                  <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
                  
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                              <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset={off} stopColor="#10B981" stopOpacity={0.08} />
                                  <stop offset={off} stopColor="#EF4444" stopOpacity={0.08} />
                              </linearGradient>
                              <linearGradient id="splitStroke" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset={off} stopColor="#10B981" stopOpacity={1} />
                                  <stop offset={off} stopColor="#EF4444" stopOpacity={1} />
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                          <YAxis domain={[-1, 1]} hide />
                          <ReferenceLine y={0} stroke="#000" strokeOpacity={0.08} strokeDasharray="3 3" />
                          <Tooltip 
                              contentStyle={{ 
                                  backgroundColor: '#fff', 
                                  border: '1px solid rgba(0,0,0,0.06)', 
                                  borderRadius: '6px', 
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                  fontSize: '12px',
                                  padding: '8px 12px'
                              }} 
                              itemStyle={{ color: '#000', fontWeight: 500 }}
                              formatter={(val: number) => [val.toFixed(2), "Score"]}
                              labelStyle={{ display: 'none' }}
                              cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1 }}
                          />
                          <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke="url(#splitStroke)" 
                              fill="url(#splitColor)" 
                              strokeWidth={1.5}
                              isAnimationActive={false}
                          />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* BOTTOM HALF: KPI Grid */}
          <div className="flex-1 lg:h-1/2 min-h-[250px] lg:min-h-0 bg-gray-50/50 p-4 overflow-hidden">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 h-full">
                  <KpiCard label="Confidence" value={confidence} suffix="%" icon={<Activity size={14} />} />
                  <KpiCard label="Risk Level" value={risk} suffix="%" icon={<AlertCircle size={14} />} color={risk > 50 ? 'text-red-600' : 'text-text'} />
                  <KpiCard label="Momentum" value={momentum > 0 ? `+${momentum}` : momentum} icon={<TrendingUp size={14} />} color={momentum > 0 ? 'text-emerald-600' : 'text-red-600'} />
                  <KpiCard label="Discrepancy" value={discrepancyLevel} icon={<RefreshCw size={14} />} />
                  <KpiCard label="Event Link" value="High" icon={<Zap size={14} />} />
                  <KpiCard label="CEO-CFO Gap" value="0.4" icon={<Activity size={14} />} />
              </div>
          </div>
      </div>
    </div>
  );
};

// Polished KPI Card
// Simplified to fit cleanly in a dense grid
const KpiCard = ({ label, value, suffix = '', icon, color = 'text-text' }: any) => (
    <div className="bg-white border border-borderLight rounded-lg p-3 flex flex-col justify-between shadow-sm hover:border-black/10 transition-colors cursor-default group h-full min-h-[80px]">
        <div className="flex items-center gap-1.5 text-muted text-[10px] font-medium uppercase tracking-wider truncate">
            <span className="opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span> 
            <span className="truncate">{label}</span>
        </div>
        <div className={`text-[18px] lg:text-[22px] font-semibold tracking-tight tabular-nums ${color} leading-none mt-1`}>
            {value}<span className="text-[12px] text-muted font-normal ml-0.5 opacity-60 align-top">{suffix}</span>
        </div>
    </div>
);