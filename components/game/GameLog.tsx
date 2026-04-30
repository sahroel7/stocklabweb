import React from 'react';
import { useGameStore } from '@/lib/store';

export const GameLog: React.FC = () => {
  const logs = useGameStore((state) => state.logs);

  return (
    <div className="bg-black/20 rounded-xl p-4 h-full border border-white/5 flex flex-col">
      <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Activity Log</h3>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
        {logs.map((log, i) => (
          <div key={i} className="text-sm text-white/80 border-l-2 border-white/10 pl-3 py-1 animate-in fade-in slide-in-from-left-2 duration-300">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};
