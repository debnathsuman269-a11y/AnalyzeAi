import React from 'react';
import { GroundingSource } from '../types.ts';

interface SourceListProps {
  sources: GroundingSource[];
}

const SourceList: React.FC<SourceListProps> = ({ sources }) => {
  if (sources.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <h4 className="text-sm font-semibold text-textMuted mb-3">Sources & References</h4>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, idx) => (
          <a
            key={idx}
            href={source.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-surface hover:bg-surfaceHighlight text-blue-400 px-3 py-1.5 rounded border border-border transition-colors truncate max-w-[200px]"
            title={source.title}
          >
            {source.title}
          </a>
        ))}
      </div>
    </div>
  );
};

export default SourceList;