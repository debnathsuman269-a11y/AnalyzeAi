import React from 'react';
import { MarketData, MarketMover } from '../types.ts';

interface MarketDashboardProps {
  data: MarketData | null;
  loading: boolean;
  onSelect: (symbol: string) => void;
}

const MoverCard: React.FC<{ item: MarketMover, type: 'gainer' | 'loser' | 'breakout', onClick: () => void }> = ({ item, type, onClick }) => {
  let colorClass = '';
  let icon = null;

  if (type === 'gainer') {
    colorClass = 'text-green-500 bg-green-500/10 border-green-500/20';
    icon = (
      <svg className="w-3 h-3 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    );
  } else if (type === 'loser') {
    colorClass = 'text-red-500 bg-red-500/10 border-red-500/20';
    icon = (
      <svg className="w-3 h-3 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    );
  } else {
    colorClass = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    icon = (
      <svg className="w-3 h-3 text-blue-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="flex justify-between items-center p-2 rounded-lg bg-surface hover:bg-surfaceHighlight border border-border cursor-pointer transition-all hover:translate-x-1"
    >
      <div className="flex flex-col">
        <span className="font-bold text-sm text-textMain">{item.symbol}</span>
        <span className="text-xs text-textMuted">₹{item.price}</span>
      </div>
      <div className={`px-2 py-1 rounded text-xs font-bold flex items-center ${colorClass}`}>
        {icon}
        {item.change}
      </div>
    </div>
  );
};

const MarketDashboard: React.FC<MarketDashboardProps> = ({ data, loading, onSelect }) => {
  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto mb-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {[1, 2, 3].map(i => (
               <div key={i} className="h-40 bg-surface rounded-xl border border-border opacity-50"></div>
           ))}
        </div>
      </div>
    );
  }

  if (!data || (data.gainers.length === 0 && data.losers.length === 0)) return null;

  return (
    <div className="w-full max-w-6xl mx-auto mb-10 animate-fade-in px-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Top Gainers */}
        <div className="bg-surface/50 backdrop-blur rounded-xl border border-border p-4 shadow-lg">
           <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="font-bold text-textMain">Top Gainers</h3>
           </div>
           <div className="space-y-2">
              {data.gainers.slice(0, 5).map((stock, i) => (
                  <MoverCard key={i} item={stock} type="gainer" onClick={() => onSelect(stock.symbol)} />
              ))}
              {data.gainers.length === 0 && <div className="text-xs text-textMuted italic">No data available</div>}
           </div>
        </div>

        {/* Top Losers */}
        <div className="bg-surface/50 backdrop-blur rounded-xl border border-border p-4 shadow-lg">
           <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <h3 className="font-bold text-textMain">Top Losers</h3>
           </div>
           <div className="space-y-2">
              {data.losers.slice(0, 5).map((stock, i) => (
                  <MoverCard key={i} item={stock} type="loser" onClick={() => onSelect(stock.symbol)} />
              ))}
              {data.losers.length === 0 && <div className="text-xs text-textMuted italic">No data available</div>}
           </div>
        </div>

        {/* 52 Week Breakout */}
        <div className="bg-surface/50 backdrop-blur rounded-xl border border-border p-4 shadow-lg">
           <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-textMain">52W Breakout</h3>
           </div>
           <div className="space-y-2">
              {data.breakouts.slice(0, 5).map((stock, i) => (
                  <MoverCard key={i} item={stock} type="breakout" onClick={() => onSelect(stock.symbol)} />
              ))}
              {data.breakouts.length === 0 && <div className="text-xs text-textMuted italic">No data available</div>}
           </div>
        </div>

      </div>
    </div>
  );
};

export default MarketDashboard;