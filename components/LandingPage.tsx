import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { WaitlistModal } from './WaitlistModal';
import { LiveCall } from './LiveCall';
import { Navigation } from './Navigation';

export const LandingPage: React.FC = () => {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  const scrollToLive = () => {
    document.getElementById('live')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FCFCFC] text-text font-sans selection:bg-black/5">
      <WaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} />

      {/* Navigation */}
      <Navigation activeTab="" onTabChange={() => {}} onJoinClick={() => setIsWaitlistOpen(true)} />

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tighter text-text mb-6 leading-[1.1]">
            Real-time earnings call<br />narrative intelligence.
          </h1>
          <p className="text-lg md:text-xl text-muted/80 font-normal leading-relaxed max-w-xl mx-auto mb-10 antialiased">
            Detect management confidence shifts, risk framing, and discrepancies in real-time. Contextualized by market events.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button 
                onClick={() => setIsWaitlistOpen(true)}
                className="h-11 px-6 rounded-full bg-text text-white text-[14px] font-medium hover:bg-black/90 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto shadow-sm"
            >
                Join the waitlist
            </button>
            <button 
                onClick={scrollToLive}
                className="h-11 px-6 rounded-full bg-white border border-borderLight text-muted hover:text-text hover:border-black/10 text-[14px] font-medium transition-all flex items-center justify-center gap-2 w-full sm:w-auto hover:bg-gray-50/50"
            >
                See live simulation
            </button>
          </div>
        </div>
      </section>

      {/* Live Simulation Section */}
      <section id="live" className="py-20 px-4 md:px-8 bg-white border-t border-borderLight scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-baseline justify-between mb-8 md:mb-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-text mb-1">Live Simulation</h2>
              <p className="text-[14px] text-muted">Detecting narrative shifts in NVIDIA Q3 Earnings.</p>
            </div>
            {/* Status Pill */}
            <div className="hidden md:flex items-center gap-2 text-[12px] font-medium text-emerald-700 bg-emerald-50/50 px-3 py-1 rounded-full border border-emerald-100/50 mt-4 md:mt-0">
               <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Active Simulation
            </div>
          </div>

          {/* Embedded Simulation Component */}
          <LiveCall />

        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-borderLight bg-[#FAFAFA]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="text-[12px] text-muted font-medium">© 2024 Coffers.ai Inc.</span>
            <div className="flex gap-6">
                <span className="text-[12px] text-muted hover:text-text cursor-pointer transition-colors">Privacy</span>
                <span className="text-[12px] text-muted hover:text-text cursor-pointer transition-colors">Terms</span>
                <span className="text-[12px] text-muted hover:text-text cursor-pointer transition-colors">Contact</span>
            </div>
        </div>
      </footer>
    </div>
  );
};