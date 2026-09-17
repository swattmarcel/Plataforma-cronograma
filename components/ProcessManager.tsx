
import React, { useState } from 'react';
import { ProcessTemplate } from '../types';

interface ProcessManagerProps {
  processes: ProcessTemplate[];
  onAdd: (p: ProcessTemplate) => void;
  onRemove: (id: string) => void;
}

const ProcessManager: React.FC<ProcessManagerProps> = ({ processes, onAdd, onRemove }) => {
  const [name, setName] = useState('');
  const [days, setDays] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onAdd({ id: Math.random().toString(36).substr(2, 9), name, defaultDurationDays: days });
    setName('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <i className="fa-solid fa-gears text-indigo-500"></i>
        Configuração de Processos (Templates)
      </h3>
      
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 mb-6 items-end bg-slate-50 p-4 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nome do Processo</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Ex: Diagramação Final"
          />
        </div>
        <div className="w-32">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Duração (Dias)</label>
          <input 
            type="number" 
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition-all h-[38px]">
          Adicionar
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {processes.map(p => (
          <div key={p.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg hover:shadow-md transition-all group">
            <div>
              <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
              <p className="text-xs text-slate-500">{p.defaultDurationDays} dias sugeridos</p>
            </div>
            <button 
              onClick={() => onRemove(p.id)}
              className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <i className="fa-solid fa-trash"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessManager;
