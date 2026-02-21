import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { WaitlistModal } from './WaitlistModal';
import { Navigation } from './Navigation';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "What does Coffers actually do?",
    answer: "Coffers is being built to help analysts understand when an earnings narrative has meaningfully deviated from its historical pattern. During earnings calls, numbers are important, but the framing around those numbers often signals more than the metrics themselves. A shift in tone, increased hedging in forward-looking commentary, or a reframed commitment can indicate evolving confidence or emerging risk.\n\nCoffers compares live management language against prior quarters and stated commitments to surface where that deviation occurs. The output is not another transcript or summary. It is a structured indication that something has changed, tied directly to the verbatim transcript evidence that triggered it.\n\nThe aim is to make narrative deviation explicit rather than something an analyst must detect purely from memory."
  },
  {
    question: "Why focus on narrative deviation rather than tone or sentiment?",
    answer: "Analysts rarely react to tone in isolation. What matters more is whether the language is different from what was said before. A statement can be positive yet still represent a step back from prior confidence. Similarly, cautious language may not be new if it reflects an already established posture.\n\nThe challenge is not identifying whether language sounds optimistic or defensive, but determining whether it diverges from its own historical baseline. Coffers is being developed around that distinction.\n\nInstead of classifying sentiment, it concentrates on measuring change relative to past communication so that analysts can assess whether a shift is incremental or material."
  },
  {
    question: "How does this fit into an analyst's existing workflow?",
    answer: "Most analysts already use transcripts, research platforms, and internal notes to follow earnings calls. These tools provide access and searchability, which are valuable. The difficulty emerges when trying to consistently track how management language evolves across multiple quarters while listening live.\n\nHuman interpretation is influenced by time pressure and context, and subtle shifts can be easy to overlook. Coffers is being designed as a structured comparison layer within that workflow.\n\nIt does not replace judgment or modeling. It aims to reduce the cognitive effort required to recognize narrative deviation and to provide clear reference points when reviewing what changed."
  }
];

interface Props {
  onNavigate: (page: string) => void;
}

export const FAQPage: React.FC<Props> = ({ onNavigate }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#FCFCFC] text-text font-sans selection:bg-black/5">
      <WaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} />

      <Navigation activeTab="faq" onTabChange={onNavigate} onJoinClick={() => setIsWaitlistOpen(true)} />

      {/* Header */}
      <section className="pt-32 pb-16 px-6 md:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tighter text-text mb-4 leading-[1.1]">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted/80 font-normal leading-relaxed max-w-2xl">
            Understanding how Coffers.ai approaches narrative intelligence for earnings analysis.
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="pb-24 px-6 md:px-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {FAQ_DATA.map((item, index) => (
            <div key={index} className="border border-borderLight rounded-2xl bg-white overflow-hidden">
              <button
                onClick={() => toggleItem(index)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="text-[16px] md:text-[18px] font-semibold text-text pr-4">
                  {item.question}
                </span>
                <ChevronDown
                  size={20}
                  className={`text-muted flex-none transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <div className="text-[15px] text-muted leading-relaxed space-y-4">
                    {item.answer.split('\n\n').map((paragraph, pIndex) => (
                      <p key={pIndex}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
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
