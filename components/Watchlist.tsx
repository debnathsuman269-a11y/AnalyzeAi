import React from 'react';

interface WatchlistProps {
  favorites: string[];
  onSelect: (term: string) => void;
  onRemove: (term: string, e: React.MouseEvent) => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ favorites, onSelect, onRemove }) => {
  if (favorites.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 animate-fade-in">
      <div className="flex items-center mb-3 px-1">
        <svg className="w-4 h-4 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <h3 className="text-sm font-semibold text-textMuted uppercase tracking-wide">Your Watchlist</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {favorites.map((stock) => (
          <div
            key={stock}
            onClick={() => onSelect(stock)}
            className="group flex items-center bg-surface hover:bg-surfaceHighlight border border-border hover:border-accent/50 rounded-lg px-4 py-2 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <span className="text-textMain font-medium mr-3">{stock}</span>
            <button
              onClick={(e) => onRemove(stock, e)}
              className="text-textMuted hover:text-red-400 p-1 rounded-full hover:bg-background transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Remove from watchlist"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Watchlist;