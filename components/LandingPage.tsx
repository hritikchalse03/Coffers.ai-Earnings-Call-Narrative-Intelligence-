import React, { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { WaitlistModal } from './WaitlistModal';
import { LiveCall } from './LiveCall';

export const LandingPage: React.FC = () => {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  const scrollToLive = () => {
    document.getElementById('live')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-bg text-text font-sans selection:bg-accent/10">
      <WaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-borderLight">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-semibold text-[16px] tracking-tight">Coffers.ai</span>
          <button 
              onClick={() => setIsWaitlistOpen(true)}
              className="bg-text text-white px-5 py-2 rounded-full text-[13px] font-medium hover:bg-black/90 transition-opacity"
          >
              Join waitlist
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-[56px] md:text-[72px] leading-[1.05] font-semibold tracking-tighter text-text mb-8">
            Real-time earnings call<br />narrative intelligence.
          </h1>
          <p className="text-[20px] leading-relaxed text-muted font-normal max-w-2xl mx-auto mb-12">
            Detect management confidence shifts, risk framing, and narrative discrepancies in real-time. Contextualized by market events.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
                onClick={() => setIsWaitlistOpen(true)}
                className="h-14 px-8 rounded-full bg-text text-white text-[16px] font-medium hover:bg-black/90 transition-transform active:scale-[0.98] w-full sm:w-auto shadow-sm"
            >
                Join the waitlist
            </button>
            <button 
                onClick={scrollToLive}
                className="h-14 px-8 rounded-full bg-transparent text-muted hover:text-text text-[15px] font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
            >
                See live simulation
                <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Live Simulation Section */}
      <section id="live" className="py-24 px-6 bg-white border-t border-borderLight scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-baseline justify-between mb-12">
            <div>
              <h2 className="text-[32px] font-semibold tracking-tight text-text mb-2">Live Simulation</h2>
              <p className="text-[16px] text-muted">Narrative momentum tracking in real-time.</p>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-muted bg-gray-50 px-3 py-1.5 rounded-full border border-borderLight mt-4 md:mt-0">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live Demo: NVIDIA Q3 Earnings
            </div>
          </div>

          {/* Embedded Simulation Component */}
          <LiveCall />

        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-borderLight mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="text-[13px] text-muted">© 2024 Coffers.ai Inc.</span>
            <div className="flex gap-6">
                <span className="text-[13px] text-muted hover:text-text cursor-pointer transition-colors">Privacy</span>
                <span className="text-[13px] text-muted hover:text-text cursor-pointer transition-colors">Terms</span>
                <span className="text-[13px] text-muted hover:text-text cursor-pointer transition-colors">Contact</span>
            </div>
        </div>
      </footer>
    </div>
  );
};