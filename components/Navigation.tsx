import React from 'react';
import { Search, Bell } from 'lucide-react';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'market', label: 'Overview' },
    { id: 'live', label: 'Live Simulation' },
    { id: 'company', label: 'Company' },
  ];

  return (
    <header className="h-16 flex items-center justify-between px-6 md:px-8 bg-bg border-b border-borderLight sticky top-0 z-50">
      
      {/* Left: Branding */}
      <div className="w-48 flex items-center gap-2">
        <span className="font-semibold text-[18px] tracking-tight text-text">Coffers.ai</span>
      </div>

      {/* Center: Minimal Tabs */}
      <nav className="flex items-center space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative py-5 text-[14px] font-medium transition-colors duration-200
              ${activeTab === tab.id 
                ? 'text-text' 
                : 'text-muted hover:text-text'}
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-accent rounded-t-full"></span>
            )}
          </button>
        ))}
      </nav>

      {/* Right: Actions */}
      <div className="w-48 flex items-center justify-end gap-6">
        <Search size={18} className="text-muted hover:text-text cursor-pointer transition-colors" strokeWidth={1.5} />
        <div className="relative">
           <Bell size={18} className="text-muted hover:text-text cursor-pointer transition-colors" strokeWidth={1.5} />
           <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-danger rounded-full border border-bg"></span>
        </div>
        <div className="w-7 h-7 rounded-full bg-accent-subtle border border-borderLight"></div>
      </div>
    </header>
  );
};