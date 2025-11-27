import React from 'react';
import { EarningsResult } from '../types.ts';

interface EarningsTickerProps {
  earnings: EarningsResult[];
  loading: boolean;
  onSelect: (symbol: string) => void;
}

const EarningsTicker: React.FC<EarningsTickerProps> = ({ earnings, loading, onSelect }) => {
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto mb-8 text-center animate-pulse">
        <div className="inline-flex items-center space-x-2 bg-surface px-4 py-2 rounded-full border border-border">
           <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
           <span className="text-sm text-textMuted">Loading today's market events...</span>
        </div>
      </div>
    );
  }

  if (earnings.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mb-10 animate-fade-in">
      <div className="flex items-center mb-4 justify-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
            Results Today
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {earnings.map((item, idx) => (
          <div 
            key={idx}
            onClick={() => onSelect(item.name)}
            className="group bg-surface hover:bg-surfaceHighlight border border-border hover:border-blue-500/50 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 relative overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </div>
            <h4 className="font-bold text-textMain truncate pr-6">{item.symbol}</h4>
            <p className="text-xs text-textMuted truncate mb-2">{item.name}</p>
            <div className="inline-block bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20">
                {item.expectation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EarningsTicker;