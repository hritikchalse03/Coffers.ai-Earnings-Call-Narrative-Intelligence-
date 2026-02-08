import React from 'react';
import { MOCK_COMPANIES } from '../constants';
import { SignalBadge } from './SignalBadge';
import { ArrowRight, AudioWaveform } from 'lucide-react';
import { SignalDirection } from '../types';

export const MarketOverview: React.FC<{ onSelectCompany: (ticker: string) => void }> = ({ onSelectCompany }) => {
  
  const movers = [...MOCK_COMPANIES].sort((a, b) => Math.abs(b.lastQuarterMomentum) - Math.abs(a.lastQuarterMomentum));
  const liveCalls = movers.slice(0, 3);

  return (
    <div className="h-full overflow-y-auto space-y-12">
      
      {/* Top Metrics Row - Static for now but sets the tone */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
            { label: 'Market Sentiment', value: 'Cautious', trend: 'Neutral', isAlert: false },
            { label: 'Avg Confidence', value: '64.2', trend: '+2.1', isAlert: false },
            { label: 'Risk Intensity', value: 'High', trend: 'Consumer Sector', isAlert: true }
        ].map((m, i) => (
            <div key={i} className="flex flex-col gap-1">
                <span className="text-[12px] text-muted font-normal">{m.label}</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-[32px] font-medium text-text">{m.value}</span>
                    <span className={`text-[14px] font-medium ${m.isAlert ? 'text-danger' : 'text-accent'}`}>{m.trend}</span>
                </div>
            </div>
        ))}
      </section>

      {/* SECTION 1: CALLS LIVE NOW */}
      <section>
        <div className="flex items-baseline justify-between mb-4 border-b border-borderLight pb-2">
            <h2 className="text-[16px] font-medium text-text">Calls Live Now</h2>
            <span className="text-[12px] text-muted">3 Active</span>
        </div>
        
        <div className="flex flex-col">
            {liveCalls.map((company, i) => (
                <div 
                    key={company.ticker}
                    onClick={() => onSelectCompany(company.ticker)}
                    className="group py-4 flex items-center justify-between cursor-pointer border-b border-borderLight hover:bg-accentSubtle transition-colors last:border-0"
                >
                    <div className="flex items-center gap-4 w-1/3">
                        <div className="w-8 h-8 rounded-full bg-accent/5 flex items-center justify-center text-accent">
                            <AudioWaveform size={14} />
                        </div>
                        <div>
                            <div className="text-[14px] font-semibold text-text">{company.ticker}</div>
                            <div className="text-[13px] text-muted font-normal">{company.name}</div>
                        </div>
                    </div>

                    <div className="w-1/3 flex items-center gap-8">
                         <div className="flex flex-col">
                            <span className="text-[10px] text-muted uppercase tracking-wide">Conf</span>
                            <span className="text-[14px] font-medium text-text">72</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] text-muted uppercase tracking-wide">Risk</span>
                            <span className="text-[14px] font-medium text-text">18</span>
                         </div>
                    </div>

                    <div className="w-1/3 flex justify-end">
                        <ArrowRight size={16} className="text-borderLight group-hover:text-muted transition-colors" />
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* SECTION 2: TOP MOVERS */}
      <section>
        <div className="flex items-baseline justify-between mb-4 border-b border-borderLight pb-2">
            <h2 className="text-[16px] font-medium text-text">Narrative Momentum</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {/* List Column 1 */}
            <div>
                <h3 className="text-[12px] text-muted font-medium mb-4 uppercase tracking-wide">Positive Shift</h3>
                <div className="space-y-1">
                    {movers.filter(c => c.lastQuarterMomentum > 0).slice(0, 5).map(company => (
                        <div key={company.ticker} onClick={() => onSelectCompany(company.ticker)} className="py-3 flex items-center justify-between border-b border-borderLight last:border-0 cursor-pointer group">
                             <div className="flex flex-col">
                                <span className="text-[14px] font-medium text-text group-hover:text-accent transition-colors">{company.ticker}</span>
                                <span className="text-[12px] text-muted">{company.sector}</span>
                             </div>
                             <SignalBadge 
                                label="" 
                                value={company.lastQuarterMomentum} 
                                direction={SignalDirection.STRENGTHENING}
                                color="blue" 
                                minimal 
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* List Column 2 */}
            <div>
                <h3 className="text-[12px] text-muted font-medium mb-4 uppercase tracking-wide">Negative Shift</h3>
                <div className="space-y-1">
                    {movers.filter(c => c.lastQuarterMomentum < 0).slice(0, 5).map(company => (
                        <div key={company.ticker} onClick={() => onSelectCompany(company.ticker)} className="py-3 flex items-center justify-between border-b border-borderLight last:border-0 cursor-pointer group">
                             <div className="flex flex-col">
                                <span className="text-[14px] font-medium text-text group-hover:text-danger transition-colors">{company.ticker}</span>
                                <span className="text-[12px] text-muted">{company.sector}</span>
                             </div>
                             <SignalBadge 
                                label="" 
                                value={Math.abs(company.lastQuarterMomentum)} 
                                direction={SignalDirection.DETERIORATING}
                                color="rose" 
                                minimal 
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};