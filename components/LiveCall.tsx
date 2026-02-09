import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine, YAxis } from 'recharts';
import { Play, Pause, RefreshCw, Zap, TrendingUp, AlertCircle, Activity, Mic, ArrowDown, X, ChevronRight, ArrowUpRight, ArrowDownRight, Minus, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { TranscriptSegment, AnalysisResponse, NarrativeDriver } from '../types';
import { StreamService } from '../services/streamService';
import { NarrativeProcessor } from '../services/narrativeProcessor';

// Definitions for KPI Hover States
const METRIC_DEFINITIONS: Record<string, string> = {
  "Confidence": "AI-derived score of speaker certainty and assertiveness (0-100).",
  "Risk Level": "Frequency of hedging, defensive language, and risk disclosure.",
  "Momentum": "Real-time rate of change in narrative sentiment over the last 5 minutes.",
  "Discrepancy": "Detected contradictions between current statements and prior guidance.",
  "Event Link": "Correlation strength with recent external market events.",
  "CEO-CFO Gap": "Divergence in sentiment between CEO (Strategy) and CFO (Execution)."
};

// --- HELPER COMPONENT: Highlight specific phrases in transcript ---
const HighlightedText = ({ text, highlight }: { text: string, highlight?: string }) => {
  if (!highlight || !text) return <>{text}</>;
  
  // Clean up quotes for matching
  const cleanHighlight = highlight.replace('...', '').trim();
  const index = text.toLowerCase().indexOf(cleanHighlight.toLowerCase());
  
  if (index === -1) return <>{text}</>;

  const before = text.substring(0, index);
  const match = text.substring(index, index + cleanHighlight.length);
  const after = text.substring(index + cleanHighlight.length);

  return (
    <>
      {before}
      <span className="bg-yellow-100/80 border-b-2 border-yellow-200 text-gray-900 font-medium rounded-[2px] px-0.5 mx-[-2px]">
        {match}
      </span>
      {after}
    </>
  );
};

// Persistent Driver Item Interface
interface DriverHistoryItem {
  id: string;
  segmentId: string;
  quote: string;
  trend: 'Up' | 'Down' | 'Flat';
  timestamp: number;
}

export const LiveCall: React.FC = () => {
  // Data State
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [driversHistory, setDriversHistory] = useState<DriverHistoryItem[]>([]);
  
  // KPI States
  const [confidence, setConfidence] = useState(50);
  const [risk, setRisk] = useState(20);
  const [momentum, setMomentum] = useState(0);
  const [discrepancyLevel, setDiscrepancyLevel] = useState<'Low' | 'Medium' | 'High'>('Low');

  // UI States
  const [isPlaying, setIsPlaying] = useState(true);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [showResumeBtn, setShowResumeBtn] = useState(false);
  
  // Drivers Panel Scroll State
  const [isDriversAutoScroll, setIsDriversAutoScroll] = useState(true);
  const [showDriverResumeBtn, setShowDriverResumeBtn] = useState(false);
  
  // --- MARKET-GRADE ZOOM STATE ---
  const [windowSize, setWindowSize] = useState<number>(60);
  const [endOffset, setEndOffset] = useState<number>(0);
  const [isPanning, setIsPanning] = useState(false);
  const dragStartX = useRef<number>(0);
  const dragStartOffset = useRef<number>(0);

  // Panel & Splitter State (Pixel-based)
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(320); 
  const [isDragging, setIsDragging] = useState(false);

  // Interaction States
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);
  const [selectedDriverIndex, setSelectedDriverIndex] = useState<number | null>(null); 
  
  // Refs
  const streamServiceRef = useRef<StreamService | null>(null);
  const processorRef = useRef<NarrativeProcessor | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const driversScrollRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  const prevDataLen = useRef(0);

  // Load Drivers History from LocalStorage on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('drivers_history_tape');
      if (saved) {
        setDriversHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  // Save Drivers History
  useEffect(() => {
    localStorage.setItem('drivers_history_tape', JSON.stringify(driversHistory));
  }, [driversHistory]);

  // Initialize Data Stream
  useEffect(() => {
    // Initialize panel width
    if (rightColumnRef.current) {
        const { width } = rightColumnRef.current.getBoundingClientRect();
        const saved = localStorage.getItem('drivers_panel_width_px');
        if (saved) {
            setPanelWidth(Math.max(240, Number(saved)));
        } else if (width > 0) {
            setPanelWidth(width * 0.3); 
        }
    }

    processorRef.current = new NarrativeProcessor("demo_mode");
    streamServiceRef.current = new StreamService("demo://feed", "demo_key", handleNewSegment, () => {});
    streamServiceRef.current.connect();

    return () => streamServiceRef.current?.disconnect();
  }, []);

  // --- STABILIZE HISTORY VIEW ---
  useEffect(() => {
    const diff = chartData.length - prevDataLen.current;
    if (diff > 0 && endOffset > 0) {
        setEndOffset(prev => prev + diff);
    }
    prevDataLen.current = chartData.length;
  }, [chartData.length, endOffset]);

  // --- TRANSCRIPT SCROLL LOGIC ---
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (isAutoScrolling && hoveredChartIndex === null && selectedDriverIndex === null) {
      container.scrollTop = container.scrollHeight;
    }
  }, [segments, isAutoScrolling, hoveredChartIndex, selectedDriverIndex]);

  // --- DRIVERS AUTO-SCROLL LOGIC ---
  useEffect(() => {
    const container = driversScrollRef.current;
    if (!container) return;
    
    if (isDriversAutoScroll) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [driversHistory, isDriversAutoScroll]);

  const handleDriversScroll = () => {
    const container = driversScrollRef.current;
    if (!container) return;
    
    // Tolerance of 20px
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 20;
    
    if (isAtBottom) {
      setIsDriversAutoScroll(true);
      setShowDriverResumeBtn(false);
    } else {
      setIsDriversAutoScroll(false);
      setShowDriverResumeBtn(true);
    }
  };

  const resumeDriversAutoScroll = () => {
    setIsDriversAutoScroll(true);
    setShowDriverResumeBtn(false);
    if (driversScrollRef.current) {
        driversScrollRef.current.scrollTo({ top: driversScrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  // --- TRANSCRIPT LINKING ---
  const activeIndex = hoveredChartIndex ?? selectedDriverIndex ?? (chartData.length > 0 ? chartData.length - 1 : null);
  const activeDataPoint = activeIndex !== null ? chartData[activeIndex] : null;
  const activeSegmentId = activeDataPoint?.segmentId || null;
  const activeQuote = activeDataPoint?.drivers?.[0]?.quote || null; // Fallback for transcript highlight

  useEffect(() => {
    if (activeSegmentId && (hoveredChartIndex !== null || selectedDriverIndex !== null)) {
        const el = document.getElementById(`segment-${activeSegmentId}`);
        if (el && scrollContainerRef.current) {
            const rect = el.getBoundingClientRect();
            const containerRect = scrollContainerRef.current.getBoundingClientRect();
            const isInView = (rect.top >= containerRect.top && rect.bottom <= containerRect.bottom);

            if (!isInView) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
  }, [activeSegmentId, hoveredChartIndex, selectedDriverIndex]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;

    if (isAtBottom) {
      setIsAutoScrolling(true);
      setShowResumeBtn(false);
      if (!hoveredChartIndex) setSelectedDriverIndex(null); 
    } else {
      setIsAutoScrolling(false);
      setShowResumeBtn(true);
    }
  };

  const resumeScrolling = () => {
    setIsAutoScrolling(true);
    setShowResumeBtn(false);
    setSelectedDriverIndex(null);
    setHoveredChartIndex(null);
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleNewSegment = async (segment: TranscriptSegment) => {
    if (!isPlaying) return;

    setSegments(prev => {
        const newSegs = [...prev, segment];
        if (newSegs.length > 200) return newSegs.slice(newSegs.length - 200);
        return newSegs;
    });

    if (processorRef.current) {
        processorRef.current.addText(segment.text);
        const analysis = await processorRef.current.processBuffer(segment.role);
        
        if (analysis) {
            updateMetrics(analysis, segment.timestamp, segment.id, segment.speaker);
        }
    }
  };

  const updateMetrics = (analysis: AnalysisResponse, timestamp: string, segmentId: string, speaker: string) => {
      setConfidence(analysis.confidenceScore);
      setRisk(analysis.riskScore);
      
      const sentiment = parseFloat(((analysis.confidenceScore - analysis.riskScore) / 100).toFixed(2));
      setMomentum(sentiment);
      
      if (analysis.discrepancy) {
          setDiscrepancyLevel(analysis.discrepancy.severity);
      }

      // Update Chart Data
      setChartData(prev => {
          const lastVal = prev.length > 0 ? prev[prev.length - 1].value : 0;
          const smoothVal = (lastVal * 0.7) + (sentiment * 0.3);

          const newData = [...prev, { 
              time: timestamp, 
              value: smoothVal, 
              segmentId: segmentId, 
              speaker: speaker,
              drivers: [...analysis.confidenceDrivers, ...analysis.riskDrivers],
          }];
          
          if (newData.length > 1000) return newData.slice(newData.length - 1000);
          return newData;
      });

      // Append to Persistent Drivers Tape
      const incomingDrivers = [...analysis.confidenceDrivers, ...analysis.riskDrivers];
      if (incomingDrivers.length > 0) {
        setDriversHistory(prev => {
            const newItems: DriverHistoryItem[] = [];
            
            incomingDrivers.forEach(d => {
                // Dedupe: Don't add if (segmentId + quote) already exists in recent history
                const isDuplicate = prev.slice(-20).some(
                    p => p.segmentId === segmentId && p.quote === d.quote
                );
                
                if (!isDuplicate) {
                    newItems.push({
                        id: crypto.randomUUID(),
                        segmentId: segmentId,
                        quote: d.quote,
                        trend: d.trend,
                        timestamp: Date.now()
                    });
                }
            });

            if (newItems.length === 0) return prev;

            const updated = [...prev, ...newItems];
            // Cap at 200 items
            if (updated.length > 200) return updated.slice(updated.length - 200);
            return updated;
        });

        // Trigger panel open if closed and meaningful driver appears (optional UX, good for discovery)
        if (!isPanelOpen && incomingDrivers.some(d => d.sentiment !== 'Neutral')) {
            setIsPanelOpen(true);
        }
      }
  };

  const togglePlayback = () => {
      setIsPlaying(!isPlaying);
      if (!isPlaying) resumeScrolling();
  };

  // --- IMPLICIT ZOOM & PAN HANDLERS ---
  const handleWheel = (e: React.WheelEvent) => {
    if (chartData.length < 2) return;
    if (!chartContainerRef.current) return;
    
    const { width, left } = chartContainerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const cursorRatio = Math.max(0, Math.min(1, x / width));

    const zoomIntensity = 0.15;
    const delta = -e.deltaY;
    const factor = delta > 0 ? (1 - zoomIntensity) : (1 + zoomIntensity);

    let newWindowSize = Math.round(windowSize * factor);
    newWindowSize = Math.max(10, Math.min(chartData.length, newWindowSize));

    const currentStartIndex = chartData.length - endOffset - windowSize;
    const indexUnderCursor = currentStartIndex + (windowSize * cursorRatio);
    const newStartIndex = indexUnderCursor - (newWindowSize * cursorRatio);
    
    let newEndOffset = chartData.length - newStartIndex - newWindowSize;
    newEndOffset = Math.max(0, newEndOffset);
    newEndOffset = Math.min(chartData.length - newWindowSize, newEndOffset);

    setWindowSize(newWindowSize);
    setEndOffset(Math.round(newEndOffset));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      setIsPanning(true);
      dragStartX.current = e.clientX;
      dragStartOffset.current = endOffset;
      document.body.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isPanning || !chartContainerRef.current) return;
      
      const dx = e.clientX - dragStartX.current;
      const { width } = chartContainerRef.current.getBoundingClientRect();
      const pointsMoved = (dx / width) * windowSize;
      
      let newOffset = dragStartOffset.current + pointsMoved;
      newOffset = Math.max(0, newOffset);
      newOffset = Math.min(chartData.length - windowSize, newOffset);
      
      setEndOffset(Math.round(newOffset));
  };

  const handleMouseUp = () => {
      setIsPanning(false);
      document.body.style.cursor = '';
  };

  const handleDoubleClick = () => {
      setEndOffset(0);
      setWindowSize(60); 
  };

  // Prepare Data Slice
  const visibleStartIndex = Math.max(0, chartData.length - endOffset - windowSize);
  const visibleEndIndex = Math.max(visibleStartIndex + 1, chartData.length - endOffset);
  const visibleData = chartData.slice(visibleStartIndex, visibleEndIndex);

  const handleChartHover = (state: any) => {
    if (state.activeTooltipIndex !== undefined) {
        const globalIndex = visibleStartIndex + state.activeTooltipIndex;
        setHoveredChartIndex(globalIndex);
        
        // Auto-open panel on hover if interesting data exists (optional)
        // Removed to respect user preference more, but kept logic available if needed
    } else {
        setHoveredChartIndex(null);
    }
  };

  // --- RESIZE SPLITTER LOGIC ---
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        localStorage.setItem('drivers_panel_width_px', panelWidth.toString());
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !rightColumnRef.current) return;
    e.preventDefault();
    const containerRect = rightColumnRef.current.getBoundingClientRect();
    const rawWidth = containerRect.right - e.clientX;
    const minWidth = 240;
    const maxWidth = containerRect.width * 0.45;
    setPanelWidth(Math.max(minWidth, Math.min(rawWidth, maxWidth)));
  };

  const gradientOffset = () => {
    if (visibleData.length === 0) return 0;
    const dataMax = Math.max(...visibleData.map((i) => i.value));
    const dataMin = Math.min(...visibleData.map((i) => i.value));
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    return dataMax / (dataMax - dataMin);
  };
  
  const off = gradientOffset();

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-12 lg:h-[600px] border border-borderLight rounded-xl overflow-hidden shadow-sm bg-white">
      
      {/* LEFT COLUMN: Transcript Stream */}
      <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-borderLight bg-white relative h-[400px] lg:h-full min-h-0">
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
                  {segments.map((seg, i) => {
                      const isActive = activeSegmentId === seg.id;
                      const highlightPhrase = isActive ? activeQuote : undefined;

                      return (
                          <div 
                              key={i}
                              id={`segment-${seg.id}`}
                              className={`
                                  py-3 px-5 border-b border-borderLight/50 last:border-0 transition-colors duration-200
                                  ${isActive ? 'bg-[#FAFAFA]' : 'bg-white'}
                              `}
                          >
                              <div className="flex items-baseline justify-between mb-1">
                                  <span className={`text-[12px] font-semibold tracking-tight ${seg.role === 'CEO' ? 'text-blue-600' : seg.role === 'CFO' ? 'text-emerald-600' : 'text-text'}`}>
                                      {seg.speaker}
                                  </span>
                                  <span className="text-[10px] text-muted font-mono opacity-60 tabular-nums">{seg.timestamp}</span>
                              </div>
                              <div className={`text-[13px] leading-relaxed text-text/90 ${isActive ? 'text-text' : ''}`}>
                                  <HighlightedText text={seg.text} highlight={highlightPhrase} />
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
          
          <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-300 ${showResumeBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <button 
                  onClick={resumeScrolling}
                  className="pl-3 pr-4 py-1.5 bg-text text-white text-[11px] font-medium rounded-full shadow-lg flex items-center gap-2 hover:bg-black/90 hover:shadow-xl transition-all"
              >
                  <ArrowDown size={12} /> Resume Live
              </button>
          </div>
      </div>

      {/* RIGHT COLUMN: Graph + Panel */}
      <div ref={rightColumnRef} className="lg:col-span-5 flex flex-col h-full overflow-hidden relative">
           
          {/* TOP: Chart Area + Splitter + Panel */}
          <div className="flex-1 lg:h-1/2 min-h-[250px] lg:min-h-0 flex flex-row border-b border-borderLight relative bg-white overflow-hidden">
               
               {/* GRAPH AREA */}
               <div 
                   ref={chartContainerRef}
                   className="flex-1 flex flex-col min-w-0 h-full relative group/chart cursor-crosshair select-none"
                   onWheel={handleWheel}
                   onMouseDown={handleMouseDown}
                   onMouseMove={handleMouseMove}
                   onMouseUp={handleMouseUp}
                   onMouseLeave={handleMouseUp}
                   onDoubleClick={handleDoubleClick}
               >
                    <div className="h-12 flex-none flex items-center justify-between px-5 border-b border-borderLight bg-white z-10">
                        <span className="text-[13px] font-medium text-text tracking-tight">Narrative Momentum</span>
                        
                        {!isPanelOpen && (
                            <button 
                                onClick={() => setIsPanelOpen(true)}
                                className="text-[11px] text-muted hover:text-text flex items-center gap-1 transition-colors"
                            >
                                Drivers <ChevronRight size={12} />
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 p-0 relative w-full h-full min-h-0">
                        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
                        
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart 
                                data={visibleData} 
                                margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                                onMouseMove={handleChartHover}
                                onMouseLeave={() => setHoveredChartIndex(null)}
                                onClick={(state) => {
                                   if (state && state.activeTooltipIndex !== undefined) {
                                       setIsAutoScrolling(false);
                                   }
                                }}
                            >
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
                                    cursor={{ stroke: 'rgba(0,0,0,0.2)', strokeWidth: 1, strokeDasharray: '3 3' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="url(#splitStroke)" 
                                    fill="url(#splitColor)" 
                                    strokeWidth={1.5}
                                    isAnimationActive={false}
                                    activeDot={{ r: 4, fill: '#fff', stroke: '#000', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        
                        {/* Zoom Indicator/Hint */}
                        {endOffset > 0 && (
                            <div className="absolute bottom-2 right-4 text-[10px] bg-black/5 px-2 py-0.5 rounded text-muted pointer-events-none select-none">
                                Viewing History
                            </div>
                        )}
                        {endOffset === 0 && visibleData.length > 200 && (
                            <div className="absolute bottom-2 right-4 text-[10px] text-muted opacity-0 group-hover/chart:opacity-100 transition-opacity pointer-events-none select-none">
                                Extended History
                            </div>
                        )}
                    </div>
               </div>

               {/* DRAGGABLE SPLITTER */}
               {isPanelOpen && (
                   <div 
                       className="w-[10px] relative cursor-col-resize flex-none flex justify-center z-20 group touch-none"
                       onPointerDown={handlePointerDown}
                       onPointerMove={handlePointerMove}
                       onPointerUp={handlePointerUp}
                   >
                       <div className="w-[1px] h-full bg-borderLight group-hover:bg-accent/30 transition-colors" />
                   </div>
               )}

               {/* SIDE PANEL: Persistent Driver Tape */}
               <div 
                    style={{ width: isPanelOpen ? `${panelWidth}px` : '0px' }}
                    className={`bg-white flex flex-col border-l-0 overflow-hidden ${isDragging ? '' : 'transition-[width] duration-300 ease-in-out'}`}
                >
                   <div className="h-12 flex-none flex items-center justify-between px-4 border-b border-borderLight bg-white relative z-10">
                       <span className="text-[12px] font-semibold text-text tracking-tight">
                          Driver Tape <span className="text-muted font-normal ml-1">({driversHistory.length})</span>
                       </span>
                       <button onClick={() => setIsPanelOpen(false)} className="text-muted hover:text-text p-1 rounded hover:bg-gray-50 transition-colors"><X size={14} /></button>
                   </div>
                   
                   <div className="relative flex-1 min-w-[240px] h-full min-h-0">
                       <div 
                            ref={driversScrollRef}
                            onScroll={handleDriversScroll}
                            className="absolute inset-0 overflow-y-auto scroll-smooth-none pb-12"
                       >
                           {driversHistory.length === 0 ? (
                               <div className="flex flex-col items-center justify-center h-40 text-center px-6">
                                   <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-muted">
                                       <Activity size={14} />
                                   </div>
                                   <span className="text-[12px] text-muted font-medium">Waiting for drivers...</span>
                               </div>
                           ) : (
                               driversHistory.map((item) => {
                                   const isHighlighted = activeSegmentId === item.segmentId;
                                   
                                   return (
                                       <div 
                                            key={item.id} 
                                            className={`
                                                px-4 py-3 border-b border-borderLight last:border-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer group
                                                ${isHighlighted ? 'bg-yellow-50/50' : ''}
                                            `}
                                            onMouseEnter={() => {
                                                // Link back to graph
                                                const idx = chartData.findIndex(d => d.segmentId === item.segmentId);
                                                if (idx !== -1) setHoveredChartIndex(idx);
                                            }}
                                            onMouseLeave={() => {
                                                setHoveredChartIndex(null);
                                            }}
                                            onClick={() => {
                                                const idx = chartData.findIndex(d => d.segmentId === item.segmentId);
                                                if (idx !== -1) {
                                                    // Zoom to this point logic could go here
                                                    // For now, just stop auto-scroll to inspect
                                                    setIsAutoScrolling(false);
                                                }
                                            }}
                                        >
                                           <div className="flex items-baseline justify-between gap-3">
                                               <span className={`text-[13px] leading-snug font-medium ${isHighlighted ? 'text-black' : 'text-gray-800'}`}>
                                                   "{item.quote}"
                                               </span>
                                               
                                               <span className="flex-none self-center">
                                                    {item.trend === 'Up' ? (
                                                        <ArrowUpRight className="text-emerald-600" size={14} strokeWidth={2.5} />
                                                    ) : item.trend === 'Down' ? (
                                                        <ArrowDownRight className="text-red-600" size={14} strokeWidth={2.5} />
                                                    ) : (
                                                        <Minus className="text-muted" size={14} />
                                                    )}
                                               </span>
                                           </div>
                                       </div>
                                   );
                               })
                           )}
                       </div>

                       {/* Jump to Latest Button for Drivers */}
                       <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none ${showDriverResumeBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                           <button 
                               onClick={resumeDriversAutoScroll}
                               className="pointer-events-auto px-3 py-1.5 bg-white border border-borderLight shadow-md text-text text-[11px] font-medium rounded-full flex items-center gap-1.5 hover:bg-gray-50 transition-colors"
                           >
                               <ArrowDown size={12} /> Latest
                           </button>
                       </div>
                   </div>
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

// Polished KPI Card with Hover Definition
const KpiCard = ({ label, value, suffix = '', icon, color = 'text-text' }: any) => {
    const definition = METRIC_DEFINITIONS[label];

    return (
        <div className="group relative bg-white border border-borderLight rounded-lg p-3 flex flex-col justify-between shadow-sm hover:border-black/10 transition-colors cursor-default h-full min-h-[80px]">
            {/* Main Content */}
            <div className="flex items-center gap-1.5 text-muted text-[10px] font-medium uppercase tracking-wider truncate">
                <span className="opacity-70 group-hover:text-black transition-colors">{icon}</span> 
                <span className="truncate">{label}</span>
            </div>
            <div className={`text-[18px] lg:text-[22px] font-semibold tracking-tight tabular-nums ${color} leading-none mt-1`}>
                {value}<span className="text-[12px] text-muted font-normal ml-0.5 opacity-60 align-top">{suffix}</span>
            </div>

            {/* Hover Explanation Overlay */}
            {definition && (
                <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex flex-col justify-center rounded-lg border border-borderLight pointer-events-none">
                    <p className="text-[11px] text-text font-medium leading-relaxed">
                        {definition}
                    </p>
                </div>
            )}
        </div>
    );
};