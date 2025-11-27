import React from 'react';
import { TradeLevel } from '../types.ts';

interface TradeLevelCardProps {
  level: TradeLevel;
}

const TradeLevelCard: React.FC<TradeLevelCardProps> = ({ level }) => {
  const getActionColor = (action: string) => {
    if (action.includes('BUY')) return 'text-success bg-success/10 border-success/20';
    if (action.includes('SELL')) return 'text-danger bg-danger/10 border-danger/20';
    return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
  };

  const actionStyle = getActionColor(level.action);

  // Parse probability for visual meter
  const getProbabilityValue = (prob: string) => {
    const match = prob.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  };

  const probValue = getProbabilityValue(level.winProbability);
  
  // Dynamic gradient based on probability score
  const getGradient = (val: number) => {
    if (val >= 70) return 'from-emerald-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
    if (val >= 50) return 'from-amber-400 to-yellow-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]';
    return 'from-red-500 to-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]';
  };
  
  const getTextClass = (val: number) => {
    if (val >= 70) return 'text-success';
    if (val >= 50) return 'text-yellow-500';
    return 'text-danger';
  };

  const gradientClass = getGradient(probValue);
  const textClass = getTextClass(probValue);

  return (
    <div className="group bg-surface rounded-xl p-5 border border-border shadow-lg hover:shadow-2xl hover:border-accent/30 transition-all duration-300 relative overflow-hidden flex flex-col h-full">
      {/* Decorative background glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none group-hover:bg-accent/10 transition-colors"></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div>
           <h4 className="text-lg font-bold text-textMain tracking-wide">{level.type}</h4>
           <div className="text-xs text-textMuted mt-1 uppercase font-semibold tracking-wider">Strategy</div>
        </div>
        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border backdrop-blur-md ${actionStyle} shadow-sm`}>
          {level.action}
        </span>
      </div>
      
      {/* Main Content */}
      <div className="space-y-4 text-sm flex-grow relative z-10">
        
        {/* Grid for Entry/Target */}
        <div className="grid grid-cols-2 gap-3">
             <div className="bg-surfaceHighlight p-3 rounded-lg border border-border group-hover:border-border/80 transition-colors">
                 <span className="text-textMuted text-xs block mb-1 font-medium">Entry</span>
                 <span className="text-textMain font-mono font-bold">{level.entry}</span>
             </div>
             <div className="bg-surfaceHighlight p-3 rounded-lg border border-border group-hover:border-border/80 transition-colors">
                 <span className="text-textMuted text-xs block mb-1 font-medium">Target</span>
                 <span className="text-success font-mono font-bold">{level.target}</span>
             </div>
        </div>
        
        {/* Stop Loss Row */}
        <div className="flex items-center justify-between bg-surfaceHighlight/50 p-3 rounded-lg border border-border">
          <span className="text-textMuted text-xs font-medium">Stop Loss</span>
          <span className="text-danger font-mono font-bold">{level.stopLoss}</span>
        </div>
        
        {/* Enhanced Win Probability Meter */}
        <div className="pt-3 pb-1">
          <div className="flex justify-between items-end mb-2">
            <span className="text-textMuted text-xs font-bold uppercase tracking-wider">Win Probability</span>
            <span className={`text-lg font-bold font-mono ${textClass}`}>
                {level.winProbability}
            </span>
          </div>
          <div className="w-full bg-surfaceHighlight rounded-full h-3 overflow-hidden backdrop-blur-sm border border-border">
            <div 
              className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-1000 ease-out relative`} 
              style={{ width: `${Math.min(probValue, 100)}%` }}
            >
                <div className="absolute top-0 right-0 bottom-0 w-full bg-gradient-to-b from-white/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Reasoning Footer */}
      <div className="mt-5 pt-4 border-t border-border relative z-10">
         <div className="flex items-start">
            <svg className="w-4 h-4 text-textMuted mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-textMuted italic leading-relaxed">
                {level.reasoning}
            </p>
         </div>
      </div>
    </div>
  );
};

export default TradeLevelCard;