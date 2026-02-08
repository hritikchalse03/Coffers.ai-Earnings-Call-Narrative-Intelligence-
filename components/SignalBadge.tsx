import React from 'react';
import { SignalDirection } from '../types';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface Props {
  label: string;
  value: number;
  direction?: SignalDirection;
  color?: 'emerald' | 'rose' | 'amber' | 'blue'; // Kept for API compat, but mapped strictly below
  minimal?: boolean;
}

export const SignalBadge: React.FC<Props> = ({ label, value, direction, color = 'blue', minimal = false }) => {
  
  // Strict Design System: 
  // Rose = Danger (Critical/Risk)
  // Everything else (Emerald, Blue, Amber) = Accent (Neutral/Black)
  const isNegative = color === 'rose';
  const valueColor = isNegative ? 'text-danger' : 'text-accent';

  const Icon = () => {
      if (direction === SignalDirection.STRENGTHENING) return <ArrowUpRight className={`w-3 h-3 ${valueColor}`} strokeWidth={2.5} />;
      if (direction === SignalDirection.DETERIORATING) return <ArrowDownRight className={`w-3 h-3 ${valueColor}`} strokeWidth={2.5} />;
      return <Minus className="w-3 h-3 text-muted" />;
  };

  if (minimal) {
      return (
          <div className="flex items-center gap-1.5">
              <span className={`text-[14px] font-medium ${valueColor}`}>{value}</span>
              <Icon />
          </div>
      );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-[12px] text-muted font-normal">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[28px] font-medium tracking-tight text-text leading-none">{value}</span>
        <div className="mt-1">
             <Icon />
        </div>
      </div>
    </div>
  );
};