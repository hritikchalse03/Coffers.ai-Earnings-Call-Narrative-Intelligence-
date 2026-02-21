import React from 'react';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onJoinClick?: () => void;
}

export const Navigation: React.FC<Props> = ({ activeTab, onTabChange, onJoinClick }) => {
  return (
    <header className="h-14 flex items-center justify-between px-6 md:px-8 bg-white/80 backdrop-blur-md border-b border-borderLight sticky top-0 z-50">

      {/* Branding */}
      <div className="flex items-center">
        <span
          onClick={() => onTabChange('home')}
          className="font-semibold text-[16px] tracking-tight text-text cursor-pointer"
        >
          Coffers.ai
        </span>
      </div>

      {/* Right: Nav Links + Actions */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => onTabChange('faq')}
          className={`text-[13px] font-medium transition-colors ${
            activeTab === 'faq' ? 'text-text' : 'text-muted hover:text-text'
          }`}
        >
          FAQ
        </button>
        <button
          onClick={onJoinClick}
          className="text-[13px] font-medium text-text bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-full transition-colors"
        >
          Join Waitlist
        </button>
      </div>
    </header>
  );
};
