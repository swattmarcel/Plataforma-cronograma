
import React from 'react';
import { Conflict } from '../types';

interface ConflictPanelProps {
  conflicts: Conflict[];
}

const ConflictPanel: React.FC<ConflictPanelProps> = ({ conflicts }) => {
  if (conflicts.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-100 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <i className="fa-solid fa-triangle-exclamation text-red-600"></i>
        <h3 className="font-bold text-red-900">Alertas de Conflito ({conflicts.length})</h3>
      </div>
      
      <div className="space-y-3">
        {conflicts.map((conflict, idx) => (
          <div key={idx} className="bg-white p-3 rounded-lg border-l-4 border-red-500 shadow-sm flex items-start gap-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              conflict.severity === 'ALTA' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
            }`}>
              {conflict.severity}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-800">{conflict.description}</p>
              <p className="text-xs text-gray-500 mt-1">Tipo: {conflict.type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConflictPanel;
