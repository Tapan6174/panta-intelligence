
import React from 'react';

interface IntelligenceCardProps {
  title: string;
  insight?: string;
  children: React.ReactNode;
  className?: string;
  insightColor?: 'green' | 'red' | 'cyan' | 'gray';
  isDark?: boolean;
}

const IntelligenceCard: React.FC<IntelligenceCardProps> = ({ 
  title, 
  insight, 
  children, 
  className = "",
  insightColor = 'gray',
  isDark = true
}) => {
  const insightStyles = {
    green: isDark ? "text-green-400 bg-green-400/10 border-green-400/20" : "text-green-600 bg-green-50 border-green-200",
    red: isDark ? "text-rose-400 bg-rose-400/10 border-rose-400/20" : "text-rose-600 bg-rose-50 border-rose-200",
    cyan: isDark ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" : "text-cyan-600 bg-cyan-50 border-cyan-200",
    gray: isDark ? "text-slate-400 bg-slate-400/10 border-slate-400/20" : "text-slate-500 bg-slate-100 border-slate-200"
  };

  return (
    <div className={`glass rounded-none p-5 flex flex-col gap-4 relative overflow-hidden ${className}`}>
      <div className="flex justify-between items-start">
        <h3 className={`${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono text-xs uppercase tracking-widest`}>{title}</h3>
      </div>

      <div className="flex-grow min-h-[220px]">
        {children}
      </div>

      {insight && (
        <div className={`mt-2 p-2 rounded-none border text-[10px] font-mono leading-tight ${insightStyles[insightColor]}`}>
          <span className="opacity-70">SIGNAL:</span> {insight}
        </div>
      )}
    </div>
  );
};

export default IntelligenceCard;