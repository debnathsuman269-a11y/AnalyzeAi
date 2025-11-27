import React from 'react';

interface AnalysisCardProps {
  title: string;
  content: string;
  icon?: React.ReactNode;
  delay?: number;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ title, content, icon, delay = 0 }) => {
  // Convert markdown bullet points to styled list
  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      const cleanLine = line.trim();
      if (!cleanLine) return <br key={index} />;
      
      if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
        return (
          <div key={index} className="flex items-start mb-2">
            <span className="text-accent mr-2 mt-1.5">•</span>
            <span className="text-textMain/90">{cleanLine.substring(2)}</span>
          </div>
        );
      }
      return <p key={index} className="mb-2 text-textMain/90">{cleanLine}</p>;
    });
  };

  return (
    <div 
      className="bg-surface/60 backdrop-blur-sm border border-border rounded-xl p-6 shadow-lg hover:shadow-xl hover:border-accent/30 transition-all animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center mb-4 border-b border-border pb-2">
        {icon && <div className="mr-3 text-accent">{icon}</div>}
        <h3 className="text-xl font-bold text-textMain">{title}</h3>
      </div>
      <div className="text-sm leading-relaxed">
        {formatContent(content)}
      </div>
    </div>
  );
};

export default AnalysisCard;